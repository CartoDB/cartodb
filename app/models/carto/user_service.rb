# encoding: UTF-8

require 'active_record'

module Carto
  class UserService

    AUTH_DIGEST = '47f940ec20a0993b5e9e4310461cc8a6a7fb84e3'

    def initialize(user_model)
      @user = user_model
    end

    # TODO: Review usage to move to UserPresenter if not used anywhere else

    # Only returns owned tables (not shared ones)
    def table_count
      Carto::VisualizationQueryBuilder.new
                                      .with_user_id(@user.id)
                                      .with_type(Carto::Visualization::TYPE_CANONICAL)
                                      .build
                                      .count
    end

    def visualization_count
      Carto::VisualizationQueryBuilder.new
                                      .with_owned_by_or_shared_with_user_id(@user.id)
                                      .build
                                      .count
    end

    def public_visualization_count
      Carto::VisualizationQueryBuilder.user_public_visualizations(@user)
                                      .build
                                      .count
    end

    def twitter_imports_count(options={})
      date_to = (options[:to] ? options[:to].to_date : Date.today)
      date_from = (options[:from] ? options[:from].to_date : @user.last_billing_cycle)
      Carto::SearchTweet.twitter_imports_count(@user.search_tweets, date_from, date_to)
    end

    # Returns an array representing the last 30 days, populated with api_calls
    # from three different sources
    def get_api_calls(options = {})
      return CartoDB::Stats::APICalls.new.get_api_calls_without_dates(@user.username, {old_api_calls: false})
    end

    # This method is innaccurate and understates point based tables (the /2 is to account for the_geom_webmercator)
    # TODO: Without a full table scan, ignoring the_geom_webmercator, we cannot accuratly asses table size
    # Needs to go on a background job.
    def db_size_in_bytes
      return 0 if @user.new_record?

      attempts = 0
      begin
        # Hack to support users without the new MU functiones loaded
        # TODO: Check this works as expected
        user_data_size_function = cartodb_extension_version_pre_mu? ? 
          "CDB_UserDataSize()" : 
          "CDB_UserDataSize('#{@user.database_schema}')"
        in_database(:as => :superuser).execute("SELECT cartodb.#{user_data_size_function}")
                                      .first['cdb_userdatasize'].to_i

      rescue => e
        attempts += 1
        begin
          in_database(:as => :superuser).execute("ANALYZE")
        rescue => ee
          Rollbar.report_exception(ee)
          raise ee
        end
        retry unless attempts > 1
        CartoDB.notify_exception(e, { user: @user })
        # INFO: we need to return something to avoid 'disabled' return value
        0
      end
    end

    def maps_count
      Carto::Map.where(user_id: @user.id).count
    end

    def database_username
      if Rails.env.production?
        "cartodb_user_#{@user.id}"
      elsif Rails.env.staging?
        "cartodb_staging_user_#{@user.id}"
      else
        "#{Rails.env}_cartodb_user_#{@user.id}"
      end
    end

    def self.password_digest(password, salt)
      digest = AUTH_DIGEST
      10.times do
        digest = secure_digest(digest, salt, password, AUTH_DIGEST)
      end
      digest
    end

    def self.make_token
      secure_digest(Time.now, (1..10).map{ rand.to_s })
    end

    def cartodb_extension_version_pre_mu?
      current_version = cartodb_extension_semver(cartodb_extension_version)
      if current_version.size == 3
        major, minor, _ = current_version
        major == 0 and minor < 3
      else
        raise 'Current cartodb extension version does not match standard x.y.z format'
      end
    end

    private

    # Returns a tree elements array with [major, minor, patch] as in http://semver.org/
    def cartodb_extension_semver(extension_version)
      extension_version.split('.').take(3).map(&:to_i)
    end

    def cartodb_extension_version
      @cartodb_extension_version ||= in_database(:as => :superuser).execute('select cartodb.cdb_version() as v')
                                                                   .first['v']
    end

    def self.secure_digest(*args)
      Digest::SHA1.hexdigest(args.flatten.join('--'))
    end

    def database_password
      @user.crypted_password + database_username
    end

    def database_public_username
      (@user.database_schema != CartoDB::DEFAULT_DB_SCHEMA) ? "cartodb_publicuser_#{@user.id}" : CartoDB::PUBLIC_DB_USER
    end

    def in_database(options = {}, &block)
      if options[:statement_timeout]
        in_database.execute(%Q{ SET statement_timeout TO #{options[:statement_timeout]} })
      end

      configuration = get_db_configuration_for(options[:as])

      connection = $pool.fetch(configuration) do
        get_database(options, configuration)
      end

      if block_given?
        yield(connection)
      else
        connection
      end
    ensure
      if options[:statement_timeout]
        in_database.execute(%Q{ SET statement_timeout TO DEFAULT })
      end    
    end

    # NOTE: Must not live inside another model as AR internally uses model name as key for its internal connection cache
    # and establish_connection would override the model's connection
    def get_database(options, configuration)
      resolver = ActiveRecord::Base::ConnectionSpecification::Resolver.new( 
          configuration, get_connection_name(options[:as])
        )
      conn = ActiveRecord::Base.connection_handler.establish_connection(
          get_connection_name(options[:as]), resolver.spec
        ).connection

      unless options[:as] == :cluster_admin
        conn.execute(%Q{ SET search_path TO "#{@user.database_schema}", cartodb, public })
      end
      conn
    end

    def get_connection_name(kind = :user_model)
      kind.to_s
    end

    def connection(options = {})
    configuration = get_db_configuration_for(options[:as])

    $pool.fetch(configuration) do
      get_database(options, configuration)
    end
  end

    def get_db_configuration_for(user_type = nil)
      logger = (Rails.env.development? || Rails.env.test? ? ::Rails.logger : nil)

      # TODO: proper AR config when migration is complete
      base_config = ::Rails::Sequel.configuration.environment_for(Rails.env)
      config = {
        orm:      'ar',
        adapter:  "postgresql",
        logger:   logger,
        host:     @user.database_host,
        username: base_config['username'],
        password: base_config['password'],
        database: @user.database_name,
        port:     base_config['port'],
        encoding: base_config['encoding'].nil? ? 'unicode' : base_config['encoding']
      }

      case user_type
        when :superuser
          config    # Nothing needed, default
        when :cluster_admin
          config.merge({
              database: 'postgres'
            })
        when :public_user
          config.merge({
              username: CartoDB::PUBLIC_DB_USER,
              password: CartoDB::PUBLIC_DB_USER_PASSWORD
            })
        when :public_db_user
          config.merge({
              username: database_public_username,
              password: CartoDB::PUBLIC_DB_USER_PASSWORD
            })
        else
          config.merge({
              username: database_username,
              password: database_password,
            })
      end
    end

    def load_cartodb_functions
      #TODO: Implement
    end

    def rebuild_quota_trigger
      #TODO: Implement
    end

  end
end

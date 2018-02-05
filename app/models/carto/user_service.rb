# encoding: UTF-8

require 'active_record'
require_dependency 'carto/db/connection'

module Carto
  class UserService

    AUTH_DIGEST = '47f940ec20a0993b5e9e4310461cc8a6a7fb84e3'

    def initialize(user_model)
      @user = user_model
    end

    # TODO: Review usage to move to UserPresenter if not used anywhere else

    # Only returns owned tables (not shared ones)
    def table_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.new
                                      .with_user_id(@user.id)
                                      .with_type(Carto::Visualization::TYPE_CANONICAL)
                                      .build
                                      .count
    end

    def owned_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.new
                                      .with_user_id(@user.id)
                                      .with_type(Carto::Visualization::TYPE_DERIVED)
                                      .build
                                      .count
    end

    def visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.new
                                      .with_owned_by_or_shared_with_user_id(@user.id)
                                      .build
                                      .count
    end

    def public_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_public_visualizations(@user)
                                      .build
                                      .count
    end

    def all_visualization_count
      return 0 unless @user.id

      Carto::VisualizationQueryBuilder.user_all_visualizations(@user)
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
        in_database(as: :superuser).execute("SELECT cartodb.#{user_data_size_function}")
                                   .first['cdb_userdatasize'].to_i
      rescue => e
        attempts += 1
        begin
          in_database(as: :superuser).execute("ANALYZE")
        rescue => ee
          CartoDB.report_exception(ee, "Failed to get user db size, retrying...", user: @user)
          raise ee
        end
        retry unless attempts > 1
        CartoDB.notify_exception(e, user: @user)
        # INFO: we need to return something to avoid 'disabled' return value
        nil
      end
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

    def database_public_username
      @user.database_schema != CartoDB::DEFAULT_DB_SCHEMA ? "cartodb_publicuser_#{@user.id}" : CartoDB::PUBLIC_DB_USER
    end

    def organization_member_group_role_member_name
      @user.in_database.execute(
        "SELECT cartodb.CDB_Organization_Member_Group_Role_Member_Name() as org_member_role;"
      ).first['org_member_role']
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

    def in_database(options = {})
      options[:username] = @user.database_username
      options[:password] = @user.database_password
      options[:user_schema] = @user.database_schema
      Carto::Db::Connection.connect(@user.database_host, @user.database_name, options) do |_, connection|
        if block_given?
          yield(connection)
        else
          connection
        end
      end
    end
  end
end

# coding: UTF-8

class User < Sequel::Model
  include CartoDB::MiniSequel

  one_to_one :client_application
  one_to_many :tokens, :class => :OauthToken

  # Sequel setup & plugins
  set_allowed_columns :email, :map_enabled, :password_confirmation, :quota_in_bytes, :table_quota, :account_type, :private_tables_enabled
  plugin :validation_helpers
  plugin :json_serializer

  # Restrict to_json attributes
  @json_serializer_opts = {
    :except => [ :crypted_password,
                 :salt,
                 :invite_token,
                 :invite_token_date,
                 :admin,
                 :enabled,
                 :map_enabled],
    :naked => true # avoid adding json_class to result
  }

  self.raise_on_typecast_failure = false
  self.raise_on_save_failure = false

  ## Validations
  def validate
    super
    validates_presence :username
    validates_format /^[a-z0-9\-]+$/, :username, :message => "must only contain lowercase letters, numbers & hyphens"
    validates_presence :email
    validates_unique   :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'
    validates_presence :password if new? && (crypted_password.blank? || salt.blank?)

    if password.present? && ( password_confirmation.blank? || password != password_confirmation )
      errors.add(:password, "doesn't match confirmation")
    end
  end

  ## Callbacks
  def after_create
    super
    setup_user
    save_metadata
  end

  ## Authentication
  AUTH_DIGEST = '47f940ec20a0993b5e9e4310461cc8a6a7fb84e3'

  # allow extra vars for auth
  attr_reader :password
  attr_accessor :password_confirmation

  def self.password_digest(password, salt)
    digest = AUTH_DIGEST
    10.times do
      digest = secure_digest(digest, salt, password, AUTH_DIGEST)
    end
    digest
  end

  def self.secure_digest(*args)
    Digest::SHA1.hexdigest(args.flatten.join('--'))
  end

  def self.make_token
    secure_digest(Time.now, (1..10).map{ rand.to_s })
  end

  def password=(value)
    @password = value
    self.salt = new?? self.class.make_token : User.filter(:id => self.id).select(:salt).first.salt
    self.crypted_password = self.class.password_digest(value, salt)
  end

  def self.authenticate(email, password)
    if candidate = User.filter("email ILIKE ? OR username ILIKE ?", email, email).first
      candidate.crypted_password == password_digest(password, candidate.salt) ? candidate : nil
    else
      nil
    end
  end

  # Database configuration setup

  def database_username
    if Rails.env.production?
      "cartodb_user_#{id}"
    else
      "#{Rails.env}_cartodb_user_#{id}"
    end
  end

  def database_password
    crypted_password + database_username
  end

  def in_database(options = {}, &block)
    configuration = if options[:as]
      if options[:as] == :superuser
        ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
          'database' => self.database_name, :logger => ::Rails.logger
        )
      elsif options[:as] == :public_user
        ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
          'database' => self.database_name, :logger => ::Rails.logger,
          'username' => CartoDB::PUBLIC_DB_USER, 'password' => ''
        )
      end
    else
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => self.database_name, :logger => ::Rails.logger,
        'username' => database_username, 'password' => database_password
      )
    end
    connection = $pool.fetch(configuration) do
      ::Sequel.connect(configuration)
    end
    if block_given?
      yield(connection)
    else
      connection
    end
  end


  # TODO: delete - superceded by run_pg_query
  def run_query(query)
    rows = []
    time = nil
    in_database do |user_database|
      time = Benchmark.measure {
        rows = user_database[query].all
      }
    end
    #TODO: This part of the code should be using memcache.
    {
      :time => time.real,
      :total_rows => rows.size,
      :rows => rows.map{ |row| row.delete("the_geom"); row }
    }
  rescue => e
    if e.message =~ /^PGError/
      if e.message.include?("does not exist")
        if e.message.include?("column")
          raise CartoDB::ColumnNotExists, e.message
        else
          raise CartoDB::TableNotExists, e.message
        end
      else
        raise CartoDB::ErrorRunningQuery, e.message
      end
    else
      raise e
    end
  end

  def run_pg_query(query)
    time = nil
    res  = nil
    translation_proc = nil
    in_database do |user_database|
      time = Benchmark.measure {
        user_database.synchronize do |conn|
          res = conn.exec query
        end
        translation_proc = user_database.conversion_procs
      }
    end
    {
      :time => time.real,
      :total_rows => pg_size(res),
      :rows     => pg_to_hash(res, translation_proc),
      :results  => pg_results?(res),
      :modified => pg_modified?(res)
    }
    rescue => e
    if e.is_a? PGError
      if e.message.include?("does not exist")
        if e.message.include?("column")
          raise CartoDB::ColumnNotExists, e.message
        else
          raise CartoDB::TableNotExists, e.message
        end
      else
        raise CartoDB::ErrorRunningQuery, e.message
      end
    else
      raise e
    end
  end


  def tables
    Table.filter(:user_id => self.id).order(:id).reverse
  end

  # TODO: update without a domain
  def create_key(domain)
    raise "domain argument can't be blank" if domain.blank?
    key = self.class.secure_digest(domain)
    APIKey.create :api_key => key, :user_id => self.id, :domain => domain
  end

  # create the core user_metadata key that is used in redis
  def key
    "rails:users:#{username}"
  end

  # save users basic metadata to redis for node sql api to use
  def save_metadata
    $users_metadata.HMSET key, 'id', id, 'database_name', database_name
    self.set_map_key
  end

  def set_map_key
    token = self.class.make_token
    $users_metadata.HMSET key, 'map_key',  token
    $users_metadata.SADD "#{key}:map_key", token
  end

  def get_map_key
    $users_metadata.HMGET(key, 'map_key').first
  end

  def reset_client_application!
    if client_application
      client_application.destroy
    end
    ClientApplication.create(:user_id => self.id)
  end

  def self.find_with_custom_fields(user_id)
    User.filter(:id => user_id).select(:id,:email,:username,:tables_count,:crypted_password,:database_name,:admin).first
  end


  def enabled?
    self.enabled
  end

  def disabled?
    !self.enabled
  end

  def database_exists?
    if in_database(:as => :superuser)[:pg_database].filter(:datname => database_name).all.any?
      return true
    else
      return false
    end
  end
  private :database_exists?

  # This method is innaccurate and understates point based tables (the /2 is to account for the_geom_webmercator)
  #
  # TODO: Without a full table scan, ignoring the_geom_webmercator, we cannot accuratly asses table size
  # Needs to go on a background job.
  def db_size_in_bytes
    size = in_database(:as => :superuser).fetch("SELECT sum(pg_relation_size(table_name))
      FROM information_schema.tables
      WHERE table_catalog = '#{database_name}' AND table_schema = 'public'").first[:sum]

    # hack for the_geom_webmercator
    size / 2
  end

  def exceeded_quota?
    self.over_disk_quota? || self.over_table_quota?
  end

  def remaining_quota
    self.quota_in_bytes - self.db_size_in_bytes
  end

  def disk_quota_overspend
    self.over_disk_quota? ? self.remaining_quota.abs : 0
  end

  def over_disk_quota?
    self.remaining_quota <= 0
  end

  def over_table_quota?
    (remaining_table_quota && remaining_table_quota <= 0) ? true : false
  end

  #can be nil table quotas
  def remaining_table_quota
    if self.table_quota.present?
      remaining = self.table_quota - self.table_count
      (remaining < 0) ? 0 : remaining
    end
  end

  def table_count
    Table.filter({:user_id => self.id}).count
  end

  def rebuild_quota_trigger
    tables.all.each do |table|
      table.add_python
      table.set_trigger_check_quota
    end
  end

  ## User's databases setup methods
  def setup_user
    return if disabled?

    ClientApplication.create(:user_id => self.id)
    unless database_exists?
      self.database_name = case Rails.env
        when 'development'
          "cartodb_dev_user_#{self.id}_db"
        when 'test'
          "cartodb_test_user_#{self.id}_db"
        else
          "cartodb_user_#{self.id}_db"
      end
      save

      Thread.new do
        conn = Rails::Sequel.connection
        begin
          conn.run("CREATE USER #{database_username} PASSWORD '#{database_password}'")
        rescue
          puts "USER #{database_username} already exists: #{$!}"
        end
        begin
          conn.run("CREATE DATABASE #{self.database_name}
          WITH TEMPLATE = template_postgis
          OWNER = #{::Rails::Sequel.configuration.environment_for(Rails.env)['username']}
          ENCODING = 'UTF8'
          CONNECTION LIMIT=-1")
        rescue
          puts "DATABASE #{self.database_name} already exists: #{$!}"
        end
      end.join
      set_database_permissions
    end
  end

  def set_database_permissions
    in_database(:as => :superuser) do |user_database|
      user_database.transaction do

        # remove all public and tile user permissions
        user_database.run("REVOKE ALL ON DATABASE #{database_name} FROM PUBLIC")
        user_database.run("REVOKE ALL ON SCHEMA public FROM PUBLIC")
        user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM PUBLIC")
        user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC")
        user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC")

        user_database.run("REVOKE ALL ON DATABASE #{database_name} FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON SCHEMA public FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM #{CartoDB::PUBLIC_DB_USER}")

        user_database.run("REVOKE ALL ON DATABASE #{database_name} FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON SCHEMA public FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM #{CartoDB::TILE_DB_USER}")
        user_database.run("REVOKE ALL ON ALL TABLES IN SCHEMA public FROM #{CartoDB::TILE_DB_USER}")

        # grant core permissions to database user
        user_database.run("GRANT ALL ON DATABASE #{database_name} TO #{database_username}")
        user_database.run("GRANT ALL ON SCHEMA public TO #{database_username}")
        user_database.run("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO #{database_username}")
        user_database.run("GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO #{database_username}")
        user_database.run("GRANT ALL ON ALL TABLES IN SCHEMA public TO #{database_username}")

        # grant select permissions to public user
        user_database.run("GRANT CONNECT ON DATABASE #{database_name} TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT USAGE ON SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT SELECT ON spatial_ref_sys TO #{CartoDB::PUBLIC_DB_USER}")

        # grant select permissions to tile user
        user_database.run("GRANT CONNECT ON DATABASE #{database_name} TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT USAGE ON SCHEMA public TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT SELECT ON ALL TABLES IN SCHEMA public TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO #{CartoDB::TILE_DB_USER}")
        user_database.run("GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO #{CartoDB::TILE_DB_USER}")

        yield(user_database) if block_given?
      end
    end
  end

  # Utility methods
  def fix_permissions
    set_database_permissions do |user_database|
      tables.each do |table|
        user_database.run("ALTER TABLE #{table.name} OWNER TO #{database_username}")
      end
    end
  end

  def stats(date = Date.today)
    puts "==========================================="
    puts "Stats for user #{self.email} - #{self.id}"
    puts "==========================================="
    puts "day #{date.strftime("%Y-%m-%d")}:"
    puts "    - queries: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m-%d"))}"
    puts "    - time: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m-%d"), "time")}"
    puts
    puts "month #{date.strftime("%Y-%m")}"
    puts "   - queries: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m"))}"
    puts "   - time: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m"), "time")}"
    puts "   - select: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m"), "select")}"
    puts "   - insert: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m"), "insert")}"
    puts "   - update: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m"), "update")}"
    puts "   - delete: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m"), "delete")}"
    puts "   - other: #{CartoDB::QueriesThreshold.get(self.id, date.strftime("%Y-%m"), "other")}"
    puts
    puts "total queries: #{CartoDB::QueriesThreshold.get(self.id, "total")}"
    puts "==========================================="
  end
end

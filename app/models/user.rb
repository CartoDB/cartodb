# coding: UTF-8

class User < Sequel::Model
  one_to_one :client_application
  one_to_many :tokens, :class => :OauthToken

  plugin :validation_helpers

  self.raise_on_save_failure = false
  set_allowed_columns :email
  plugin :validation_helpers

  attr_reader :password
  attr_accessor :password_confirmation

  self.raise_on_save_failure = false

  ## Validations
  def validate
    super
    validates_presence :email
    validates_unique :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'
    errors.add(:password, "doesn't match confirmation") if password.present? && ( password_confirmation.blank? || password != password_confirmation )
  end

  ## Callbacks
  def after_create
    super
    setup_user if enabled?
  end
  #### End of Callbacks
  
  ## Authentication methods
  AUTH_DIGEST = '999f2da2a5fd99c5af493af3daf22fde939c0e67'

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
    if candidate = User.filter({:email => email} | {:username => email}).first
      candidate.crypted_password == password_digest(password, candidate.salt) ? candidate : nil
    else
      nil
    end
  end

  #### End of Authentication methods

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
    yield(connection)
  end

  def run_query(query)
    query = CartoDB::SqlParser.pre_parsing(query,self.id)
    rows = []
    time = nil
    in_database do |user_database|
      time = Benchmark.measure {
        rows = user_database[CartoDB::SqlParser.parse(query, database_name)].all
      }
    end
    if !CartoDB::SqlParser.update_schema.blank?
      if table = Table[:user_id => self.id, :name => CartoDB::SqlParser.update_schema]
        table.update_stored_schema!
      end
    end
    #TODO: This part of the code should be using memcache.
    {
      :time => time.real,
      :total_rows => rows.size,
      :rows => rows.map{ |row| row.delete("the_geom"); row }
    }
  rescue => e
    if e.message =~ /^PGError/
      raise CartoDB::ErrorRunningQuery.new(e.message)
    else
      raise e
    end
  end

  def tables
    Table.filter(:user_id => self.id).order(:id).reverse
  end

  def create_key(domain)
    raise "domain argument can't be blank" if domain.blank?
    key = self.class.secure_digest(domain)
    APIKey.create :api_key => key, :user_id => self.id, :domain => domain
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

  def enable(enabled_flag)
    @was_disabled = self.disabled?
    self.enabled = enabled_flag
    if self.enabled
      self.invite_token = self.class.make_token
      self.invite_token_date = Time.now
    end
  end

  def enabled?
    self.enabled
  end

  def disabled?
    !self.enabled
  end

  def was_disabled?
    @was_disabled
  end

  def self.new_from_email(email)
    user = self.new
    if email.present?
      user.username              = email.split('@').first
      user.email                 = email
      user.password              = email
      user.password_confirmation = email
    end
    user
  end

  def activate
    return false unless valid?
    self.invite_token = nil
    self.invite_token_date = nil
    self.enabled = true
    save
  end

  def database_exists?
    database_exist = false
    connection     = nil

    in_database(:as => :superuser) do |user_database|
      results = user_database[:pg_database].filter(:datname => database_name).all
      database_exist = results.any?? true : false
    end

    database_exist
  end
  private :database_exists?
  
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
        begin
          Rails::Sequel.connection.run("CREATE USER #{database_username} PASSWORD '#{database_password}'")
        rescue
          puts "USER #{database_username} already exists"
        end
        begin
          Rails::Sequel.connection.run("CREATE DATABASE #{self.database_name}
            WITH TEMPLATE = template_postgis
            OWNER = postgres
            ENCODING = 'UTF8'
            CONNECTION LIMIT=-1")
        rescue
          puts "DATABASE #{self.database_name} already exists"
        end
      end.join
      in_database(:as => :superuser) do |user_database|
        user_database.run("REVOKE ALL ON DATABASE #{database_name} FROM public")
        user_database.run("REVOKE ALL ON SCHEMA public FROM public")
        user_database.run("GRANT ALL ON DATABASE #{database_name} TO #{database_username}")
        user_database.run("GRANT ALL ON SCHEMA public TO #{database_username}")
        user_database.run("GRANT ALL ON ALL TABLES IN SCHEMA public TO #{database_username}")
        user_database.run("GRANT CONNECT ON DATABASE #{database_name} TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT USAGE ON SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
        user_database.run("GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
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

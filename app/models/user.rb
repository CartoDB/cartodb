# coding: UTF-8

class User < Sequel::Model

  one_to_one :client_application
  one_to_many :tokens, :class => :OauthToken

  plugin :validation_helpers

  self.raise_on_save_failure = false
  set_allowed_columns :email
  plugin :validation_helpers

  self.raise_on_save_failure = false

  ## Validations
  def validate
    super
    validates_presence :email
    validates_unique :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'
  end

  ## Validations
  def validate
    super
    validates_presence :email
    validates_unique :email, :message => 'is already taken'
    validates_format EmailAddressValidator::Regexp::ADDR_SPEC, :email, :message => 'is not a valid address'
  end

  ## Callbacks
  def after_create
    super
    setup_user
  end
  #### End of Callbacks

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
        Rails::Sequel.connection.run("CREATE USER #{database_username} PASSWORD '#{database_password}'")
        Rails::Sequel.connection.run("CREATE DATABASE #{self.database_name}
          WITH TEMPLATE = template_postgis
          OWNER = postgres
          ENCODING = 'UTF8'
          CONNECTION LIMIT=-1")
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
  ## End of User's databases setup methods

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
    self.salt = self.class.make_token if new?
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
    connection = ::Sequel.connect(configuration)
    result = nil
    begin
      result = yield(connection)
      connection.disconnect
    rescue => e
      connection.disconnect
      raise e
    end
    result
  end

  def run_query(query)
    # TODO: activate query parser
    # query, columns = CartoDB::QueryParser.parse_select(raw_query, self)
    # query = if match = raw_query.match(/^\s*(select[^;]+);?/i)
    #   match.captures[0]
    # end
    # raise CartoDB::InvalidQuery if query.blank?
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
      :columns => (rows.size > 0 ? rows.first.keys - [:the_geom]: []),
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

  def enabled?
    self.enabled
  end

  def disabled?
    !self.enabled
  end

  def self.new_from_email(email)
    user = self.new
    if email.present?
      user.username = email
      user.email    = email
      user.password = email
    end
    user
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
end

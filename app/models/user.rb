# coding: UTF-8

class CartoDB::ErrorRunningQuery < StandardError
  attr_accessor :db_message # the error message from the database
  attr_accessor :syntax_message # the query and a marker where the error is

  def initialize(message)
    @db_message = message.split("\n")[0]
    @syntax_message = message.split("\n")[1..-1].join("\n")
  end
end

class User < Sequel::Model

  ## Callbacks
  def after_create
    super
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
      user_database.run("GRANT CONNECT ON DATABASE #{database_name} TO #{CartoDB::PUBLIC_DB_USER}")
      user_database.run("GRANT USAGE ON SCHEMA public TO #{CartoDB::PUBLIC_DB_USER}")
    end
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
    self.salt = self.class.make_token if new?
    self.crypted_password = self.class.password_digest(value, salt)
  end

  def self.authenticate(email, password)
    if candidate = User.filter(:email => email).first
      candidate.crypted_password == password_digest(password, candidate.salt) ? candidate : nil
    else
      nil
    end
  end
  #### End of Authentication methods

  def database_username
    "cartodb_user_#{id}"
  end

  def database_password
    crypted_password + database_username
  end

  def in_database(options = {}, &block)
    configuration = if options[:as] && options[:as] == :superuser
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge(
        'database' => self.database_name, :logger => ::Rails.logger
      )
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
    rows = []
    time = nil
    in_database do |user_database|
      time = Benchmark.measure {
        rows = user_database[query].all
      }
    end
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
    key
  end

end

# coding: UTF-8

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
      Rails::Sequel.connection.run("create database #{self.database_name} with template = template_postgis")
    end.join
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

  def in_database(&block)
    connection = ::Sequel.connect(
      ::Rails::Sequel.configuration.environment_for(Rails.env).merge('database' => self.database_name)
    )
    result = yield(connection)
    connection.disconnect
    result
  end

  def tables
    Table.filter(:user_id => self.id).order(:id).reverse
  end

  def tables_count
    Table.filter(:user_id => self.id).count
  end

end

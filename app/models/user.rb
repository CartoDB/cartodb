class User < Sequel::Model

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
    candidate = User.filter(:email => email).first
    candidate.crypted_password == password_digest(password, candidate.salt) ? candidate : nil
  end

  #### End of Authentication methods

  def tables
    Table.filter(:user_id => self.id).order(:id).reverse
  end

  def tables_count
    Table.filter(:user_id => self.id).count
  end

end

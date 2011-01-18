class User < Sequel::Model

  def self.authenticate(email, password)
    User.filter(:email => email, :crypted_password => password).first
  end

end

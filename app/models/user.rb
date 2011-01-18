class User < Sequel::Model

  def self.authenticate(email, password)
    User.filter(:email => email, :crypted_password => password).first
  end

  def tables
    Table.filter(:user_id => self.id).order(:id).reverse
  end

  def tables_count
    Table.filter(:user_id => self.id).count
  end

end

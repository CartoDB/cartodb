module CartoDB
  @default_test_user = nil
  module Factories
    def default_user(attributes={})
      user = nil
      unless @default_test_username.nil?
        user = User.find(:username => @default_test_username)
      end
      if user.nil?
        user = new_user(attributes)
        @default_test_username = user.username
      end
      user
    end
    def new_user(attributes = {})
      attributes = attributes.dup
      user = User.new
      user.username              = attributes[:username] || String.random(5).downcase
      user.email                 = attributes[:email]    || String.random(5).downcase + '@' + String.random(5).downcase + '.com'
      user.password              = attributes[:password] || user.email.split('@').first
      user.password_confirmation = user.password
      user.admin                 = attributes[:admin] == false ? false : true
      user.private_tables_enabled= attributes[:private_tables_enabled] == false ? false : true
      user.enabled               = attributes[:enabled] == false ? false : true
      user
    end

    def create_user(attributes = {})
      user = new_user(attributes)
      user.save
    end

    def create_admin(attributes = {})
      attributes[:username] = 'Admin'
      attributes[:email]    = 'admin@example.com'
      attributes[:admin]    = true
      user = new_user(attributes)
      user.save
    end
  end
end
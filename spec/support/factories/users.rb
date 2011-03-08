module CartoDB
  module Factories
    def new_user(attributes = {})
      attributes = attributes.dup
      user = User.new
      user.username = attributes[:username] || String.random(5)
      user.email    = attributes[:email]    || String.random(5).downcase + '@' + String.random(5).downcase + '.com'
      user.password = attributes[:password] || user.email.split('@').first
      user.admin    = attributes[:admin]    || false
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
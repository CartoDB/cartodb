module CartoDB
  module Factories
    def new_user(attributes = {})
      attributes = attributes.dup
      attributes[:username] ||= String.random(5)
      attributes[:email] ||= String.random(5).downcase + '@' + String.random(5).downcase + '.com'
      attributes[:password] ||= attributes[:email].split('@').first
      User.new(attributes)
    end

    def create_user(attributes = {})
      user = new_user(attributes)
      user.save
    end
  end
end
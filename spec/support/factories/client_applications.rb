module CartoDB
  module Factories
    def new_client_application(attributes = {})
      attributes = attributes.dup
      attributes[:user] ||= create_user
      ClientApplication.new(attributes)
    end

    def create_client_application(attributes = {})
      client_application = new_client_application(attributes)
      client_application.save
    end
  end
end
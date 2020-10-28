module CartoDB
  module Factories
    def new_client_application(attributes = {})
      attributes = attributes.dup
      attributes[:user] ||= create_user
      Carto::ClientApplication.new(attributes)
    end

    def create_client_application(attributes = {})
      client_application = new_client_application(attributes)
      client_application.save
      client_application
    end
  end
end

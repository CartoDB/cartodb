module CartoDB
  module Factories
    def new_access_token(attributes = {})
      attributes = attributes.dup
      Carto::AccessToken.new(attributes)
    end

    def create_access_token(attributes = {})
      token = new_access_token(attributes)
      token.save
      token
    end
  end
end

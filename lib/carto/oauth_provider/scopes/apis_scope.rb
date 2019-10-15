module Carto
  module OauthProvider
    module Scopes
      class ApisScope < DefaultScope
        def initialize(service, description)
          super('apis', service, CATEGORY_APIS, description)
          @grant_key = :apis
        end

        def add_to_api_key_grants(grants, _user = nil)
          super(grants)
        end
      end
    end
  end
end

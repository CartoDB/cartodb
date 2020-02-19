module Carto
  module OauthProvider
    module Scopes
      class DataservicesScope < DefaultScope
        def initialize(service, description)
          super('dataservices', service, CATEGORY_MONEY, description)
          @grant_key = :services
        end

        def add_to_api_key_grants(grants, _user = nil)
          super(grants)
          ensure_includes_apis(grants, ['sql'])
        end
      end
    end
  end
end

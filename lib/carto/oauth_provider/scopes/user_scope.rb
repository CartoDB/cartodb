module Carto
  module OauthProvider
    module Scopes
      class UserScope < DefaultScope
        def initialize(service, description)
          super('user', service, CATEGORY_USER, description)
          @grant_key = :data
        end
      end
    end
  end
end

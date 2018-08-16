module Carto
  module OauthProvider
    module ResponseStrategies
      module CodeStrategy
        def self.build_redirect_uri(redirect_uri, parameters)
          redirect_uri = Addressable::URI.parse(redirect_uri)
          query = redirect_uri.query_values || {}
          redirect_uri.query_values = query.merge(parameters)

          redirect_uri.to_s
        end
      end
    end
  end
end

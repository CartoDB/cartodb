module Carto
  module OauthProvider
    module Scopes
      class DefaultScope < Scope
        def initialize(type, service, category, description)
          super("#{type}:#{service}", category, description)
          @type = type
          @service = service
        end

        def grant_section(grants)
          section = grants.find { |i| i[:type] == @type }
          section || { type: @type, @grant_key => [] }
        end

        def add_to_api_key_grants(grants, _user = nil)
          section = grant_section(grants)
          section[@grant_key] << @service
          ensure_grant_section(grants, section)
        end
      end
    end
  end
end

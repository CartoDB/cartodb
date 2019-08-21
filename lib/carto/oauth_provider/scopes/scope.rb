module Carto
  module OauthProvider
    module Scopes
      class Scope
        attr_reader :name, :category, :description

        def initialize(name, category, description)
          @name = name
          @category = category
          @description = description
        end

        def add_to_api_key_grants(grants, user); end

        def ensure_grant_section(grants, section)
          grants.reject! { |i| i[:type] == section[:type] }
          grants << section
        end

        def ensure_includes_apis(grants, apis)
          return if apis.blank?

          apis_section = grants.find { |i| i[:type] == 'apis' }
          apis_section[:apis] = (apis_section[:apis] + apis).uniq
        end
      end
    end
  end
end

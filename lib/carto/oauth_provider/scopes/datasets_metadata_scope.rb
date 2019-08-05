module Carto
  module OauthProvider
    module Scopes
      class DatasetsMetadataScope < DefaultScope
        def initialize(description)
          super('database', 'metadata', CATEGORY_DATASETS_METADATA, description)
          @grant_key = :table_metadata
        end

        def name
          "datasets:metadata"
        end

        def add_to_api_key_grants(grants, _user = nil)
          ensure_includes_apis(grants, ['sql'])
          section = grant_section(grants)
          section[@grant_key] = []
          ensure_grant_section(grants, section)
        end
      end
    end
  end
end

module Carto
  module OauthProvider
    module Scopes
      class SchemasScope < DefaultScope
        CREATE_PERMISSIONS = ['create'].freeze

        PERMISSIONS = {
          c: CREATE_PERMISSIONS
        }.freeze

        DESCRIPTIONS = {
          c: "%<schema_name>s schema (create tables)"
        }.freeze

        attr_reader :schema

        def initialize(scope)
          _, permission, @schema = self.class.schema_permission(scope)
          super('database', permission, CATEGORY_SCHEMA, description(permission.to_sym))
          @grant_key = :schemas
          @permission = permission.to_sym
        end

        def name
          return "schemas:#{@permission}:#{@schema}" if @schema

          "schemas:#{@permission}"
        end

        def description(permission = @permission, schema = @schema)
          DESCRIPTIONS[permission] % { schema_name: schema }
        end

        def permission
          PERMISSIONS[@permission]
        end

        def add_to_api_key_grants(grants, user)
          ensure_includes_apis(grants, ['sql'])
          database_section = grant_section(grants)

          schema_section = {
            name: schema || user.database_schema,
            permissions: permission
          }

          database_section[@grant_key] = [] unless database_section.key?(@grant_key)
          database_section[@grant_key] << schema_section

          ensure_grant_section(grants, database_section)
        end

        def self.schema_permission(scope)
          scope.split(':')
        end

        def self.is_a?(scope)
          scope =~ /^schemas:(?:c)(:(?:[a-z0-9_]+$|[a-z0-9-]+))?/
        end

        def self.valid_scopes(scopes)
          scopes.select { |scope| SchemasScope.is_a?(scope) }
        end

        def self.valid_scopes_with_schema(scopes, user)
          schema_scopes = valid_scopes(scopes)

          return [] unless schema_scopes.any?

          allowed = user.db_service.all_schemas_granted_hashed

          valid_scopes = []
          schema_scopes.each do |s|
            scope = Scopes.build(s)
            schema = scope.schema || user.database_schema

            if !allowed[schema].nil? &&
               (scope.permission - allowed[schema]).empty?
              valid_scopes << s
            end
          end
          valid_scopes
        end
      end
    end
  end
end

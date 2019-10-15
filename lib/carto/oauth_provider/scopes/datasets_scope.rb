module Carto
  module OauthProvider
    module Scopes
      class DatasetsScope < DefaultScope
        READ_PERMISSIONS = ['select'].freeze
        WRITE_PERMISSIONS = ['insert', 'update', 'delete'].freeze

        PERMISSIONS = {
          r: READ_PERMISSIONS,
          rw: READ_PERMISSIONS + WRITE_PERMISSIONS
        }.freeze

        DESCRIPTIONS = {
          r: "%<table_name>s (read access)",
          rw: "%<table_name>s (read/write access)"
        }.freeze

        attr_reader :table
        attr_reader :schema

        def initialize(scope)
          @table, @schema, permission = self.class.table_schema_permission(scope)
          super('database', permission, CATEGORY_DATASETS, description(permission.to_sym, @table))
          @grant_key = :tables
          @permission = permission.to_sym
        end

        def name
          schema_table = @schema.nil? ? @table : "#{@schema}.#{@table}"
          "datasets:#{@permission}:#{schema_table}"
        end

        def description(permission = @permission, table = @table, schema = @schema)
          schema_table = schema.present? && schema != 'public' ? "#{schema}.#{table}" : table
          DESCRIPTIONS[permission] % { table_name: schema_table }
        end

        def permission
          PERMISSIONS[@permission]
        end

        def add_to_api_key_grants(grants, user)
          ensure_includes_apis(grants, ['maps', 'sql'])
          database_section = grant_section(grants)

          table_section = {
            name: table,
            permissions: permission,
            schema: schema || user.database_schema
          }

          database_section[@grant_key] << table_section

          ensure_grant_section(grants, database_section)
        end

        def self.is_a?(scope)
          scope =~ /^datasets:(?:rw|r):(?:[a-z0-9_]+$|[a-z0-9-]+\.[a-z0-9_]+$)/
        end

        def self.valid_scopes(scopes)
          scopes.select { |scope| DatasetsScope.is_a?(scope) }
        end

        def self.non_dataset_scopes(scopes)
          scopes.reject { |scope| DatasetsScope.is_a?(scope) }
        end

        def self.valid_scopes_with_table(scopes, user)
          dataset_scopes = valid_scopes(scopes)

          return [] unless dataset_scopes.any?

          allowed = user.db_service.all_tables_granted_hashed

          valid_scopes = []
          dataset_scopes.each do |s|
            scope = Scopes.build(s)
            table = scope.table
            schema = scope.schema || user.database_schema

            if !allowed[schema].nil? && !allowed[schema][table].nil? &&
               (scope.permission - allowed[schema][table]).empty?
              valid_scopes << s
            end
          end
          valid_scopes
        end

        def self.permission_from_db_to_scope(permission)
          permission = permission.split(',').sort
          return nil if permission.empty? || (permission - (READ_PERMISSIONS + WRITE_PERMISSIONS)).any?
          PERMISSIONS.find { |_, values| permission == values.sort }.first
        end

        def self.table_schema_permission(scope)
          _, permission, table_and_schema = scope.split(':')
          table, schema = Table.table_and_schema(table_and_schema)
          [table, schema, permission]
        end
      end
    end
  end
end

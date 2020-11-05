module Carto
  module OauthProvider
    module Scopes
      class AllDatasetsScope < DefaultScope

        READ_PERMISSIONS = ['select'].freeze
        WRITE_PERMISSIONS = ['insert', 'update', 'delete'].freeze

        PERMISSIONS = {
          r: READ_PERMISSIONS,
          rw: READ_PERMISSIONS + WRITE_PERMISSIONS
        }.with_indifferent_access.freeze

        DESCRIPTIONS = {
          r: 'All datasets (read access)',
          rw: 'All datasets (read/write access)'
        }.with_indifferent_access.freeze

        EXCLUDED_INTERNAL_TABLES = %w(
          geography_columns
          geometry_columns
          raster_columns
          raster_overviews
          spatial_ref_sys
        ).freeze

        attr_reader :description, :permission_key, :permission

        def self.is_a?(scope)
          scope =~ /^datasets:(?:rw|r):\*$/
        end

        def self.valid_scopes(scopes)
          scopes.select { |scope| AllDatasetsScope.is_a?(scope) }
        end

        def initialize(scope)
          @permission_key = scope.split(':').second.to_sym
          @permission = PERMISSIONS[permission_key]
          @description = DESCRIPTIONS[permission_key]
          @grant_key = :tables
          super('database', permission_key, CATEGORY_DATASETS, description)
        end

        def name
          "datasets:#{permission_key}:*"
        end

        def add_to_api_key_grants(grants, user)
          ensure_includes_apis(grants, ['maps', 'sql'])
          database_section = grant_section(grants)
          granted_tables = user.db_service.tables_granted

          return unless granted_tables

          granted_tables.each do |table|
            database_section[@grant_key] << {
              name: table.name,
              permissions: combined_permissions(table.mode.to_sym),
              schema: table.table_schema
            }
          end

          ensure_grant_section(grants, database_section)
        end

        private

        def combined_permissions(table_mode)
          if permission_key == table_mode
            PERMISSIONS[@permission_key]
          elsif [permission_key, table_mode] == [:rw, :r] || [permission_key, table_mode] == [:r, :rw]
            PERMISSIONS[:r]
          else
            []
          end
        end

      end
    end
  end
end

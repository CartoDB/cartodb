require_relative './category'
require_relative './scope'
require_relative './default_scope'
require_relative './apis_scope'
require_relative './dataservices_scope'
require_relative './datasets_scope'
require_relative './all_datasets_scope'
require_relative './datasets_metadata_scope'
require_relative './schemas_scope'
require_relative './user_scope'
require_relative './scopes_validator'

module Carto
  module OauthProvider
    module Scopes
      SCOPE_DEFAULT = '_default'.freeze
      SCOPE_OFFLINE = 'offline'.freeze

      CATEGORY_OFFLINE = Category.new('Offline access').freeze
      CATEGORY_USER = Category.new('User and personal data').freeze
      CATEGORY_MONEY = Category.new('Features that consume credits', 'money')
      CATEGORY_DATASETS = Category.new('Access to your datasets')
      CATEGORY_SCHEMA = Category.new('Create tables')
      CATEGORY_DATASETS_METADATA = Category.new('List your datasets')
      CATEGORY_APIS = Category.new('Access to CARTO APIs')

      SCOPES = [
        Scope.new(SCOPE_DEFAULT, CATEGORY_USER, 'Username and organization name').freeze,
        Scope.new(SCOPE_OFFLINE, CATEGORY_OFFLINE, 'Access CARTO in the background').freeze,

        DataservicesScope.new('geocoding', 'Geocoding').freeze,
        DataservicesScope.new('isolines', 'Isolines').freeze,
        DataservicesScope.new('routing', 'Routing').freeze,

        ApisScope.new('do', 'Data Observatory API').freeze,

        UserScope.new('profile', 'User profile (avatar, name, org. owner)').freeze,
        DatasetsMetadataScope.new('Table names').freeze
      ].freeze

      SCOPES_BY_NAME = SCOPES.map { |s| [s.name, s] }.to_h.freeze

      # The default scope is always granted but cannot be explicitly requested
      SUPPORTED_SCOPES = (SCOPES.map(&:name) - [SCOPE_DEFAULT]).freeze

      def self.invalid_scopes(scopes)
        scopes -
          SUPPORTED_SCOPES -
          DatasetsScope.valid_scopes(scopes) -
          SchemasScope.valid_scopes(scopes) -
          AllDatasetsScope.valid_scopes(scopes)
      end

      def self.invalid_scopes_and_tables(scopes, user)
        scopes -
          SUPPORTED_SCOPES -
          DatasetsScope.valid_scopes_with_table(scopes, user) -
          SchemasScope.valid_scopes_with_schema(scopes, user) -
          AllDatasetsScope.valid_scopes(scopes)
      end

      def self.build(scope)
        result = SCOPES_BY_NAME[scope]
        if !result
          if DatasetsScope.is_a?(scope)
            result = DatasetsScope.new(scope)
          elsif AllDatasetsScope.is_a?(scope)
            result = AllDatasetsScope.new(scope)
          elsif SchemasScope.is_a?(scope)
            result = SchemasScope.new(scope)
          end
        end
        result
      end

      def self.scopes_by_category(new_scopes, previous_scopes = [])
        # If we had previous scopes, DEFAULT was already granted.
        previous_scopes = previous_scopes.blank? ? [] : previous_scopes + [SCOPE_DEFAULT]

        new_scopes_filtered = subtract_scopes(new_scopes, previous_scopes)
        previous_scopes_filtered = subtract_scopes(previous_scopes, new_scopes_filtered)

        all_scopes = ([SCOPE_DEFAULT] + new_scopes_filtered + previous_scopes_filtered).uniq
        scopes_by_category = all_scopes.map { |s| build(s) }.group_by(&:category)
        scopes_by_category.map do |category, scopes|
          {
            description: category.description,
            icon: category.icon,
            scopes: scopes.map do |scope|
              {
                description: scope.description,
                new: !previous_scopes.include?(scope.name)
              }
            end
          }
        end
      end

      def self.subtract_scopes(scopes1, scopes2, user_schema = 'public')
        return [] if scopes1.blank?
        return scopes1 if scopes2.blank?

        datasets1, non_datasets1 = split_dataset_scopes_for_subtract(scopes1, user_schema)
        datasets2, non_datasets2 = split_dataset_scopes_for_subtract(scopes2, user_schema)

        subtract_dataset_scopes!(datasets1, datasets2)
        datasets_results = datasets1.map { |schema_table, permissions| "datasets:#{permissions}:#{schema_table}" }

        datasets_results + (non_datasets1 - non_datasets2)
      end

      private_class_method def self.split_dataset_scopes_for_subtract(scopes, user_schema)
        datasets = {}
        non_datasets = []

        scopes.each do |scope|
          if DatasetsScope.is_a?(scope)
            table, schema, permissions = DatasetsScope.table_schema_permission(scope)
            schema ||= user_schema
            schema_table = "#{schema}.#{table}"

            datasets[schema_table] = permissions unless datasets[schema_table] == 'rw'
          else
            non_datasets << scope
          end
        end

        [datasets, non_datasets]
      end

      private_class_method def self.subtract_dataset_scopes!(datasets1, datasets2)
        return [] if datasets1.nil?
        return datasets1 if datasets2.nil?

        datasets2.each do |schema_table, permissions|
          datasets1.delete(schema_table) unless datasets1[schema_table] == 'rw' && permissions == 'r'
        end
      end
    end
  end
end

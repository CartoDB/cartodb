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

        def ensure_includes_apis(grants, apis)
          return if apis.blank?
          apis_section = grants.find { |i| i[:type] == 'apis' }
          apis_section[:apis] = (apis_section[:apis] + apis).uniq
        end
      end

      class Category
        attr_reader :description, :icon

        def initialize(description, icon = nil)
          @description = description
          @icon = icon
        end
      end

      SCOPE_DEFAULT = '_default'.freeze
      SCOPE_OFFLINE = 'offline'.freeze

      CATEGORY_OFFLINE = Category.new('Offline access').freeze
      CATEGORY_USER = Category.new('User and personal data').freeze
      CATEGORY_MONEY = Category.new('Features that consume credits', 'money')
      CATEGORY_DATASETS = Category.new('Access to your datasets')

      class DefaultScope < Scope
        def initialize(type, service, category, description)
          super("#{type}:#{service}", category, description)
          @type = type
          @service = service
        end

        def grant_section(grants)
          section = grants.find { |i| i[:type] == @type }
          unless section
            section = { type: @type, @grant_key => [] }
            grants << section
          end
          section
        end

        def add_to_api_key_grants(grants, _user = nil)
          grant_section(grants)[@grant_key] << @service
        end
      end

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

      class UserScope < DefaultScope
        def initialize(service, description)
          super('user', service, CATEGORY_USER, description)
          @grant_key = :data
        end
      end

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
          dataset_scopes.each do |scope|
            table, schema, permissions = table_schema_permission(scope)
            schema = user.database_schema if schema.nil?

            if !allowed[schema].nil? && !allowed[schema][table].nil? &&
               (PERMISSIONS[permissions.to_sym] - allowed[schema][table]).empty?
              valid_scopes << scope
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

      SCOPES = [
        Scope.new(SCOPE_DEFAULT, CATEGORY_USER, 'Username and organization name').freeze,
        Scope.new(SCOPE_OFFLINE, CATEGORY_OFFLINE, 'Access CARTO in the background').freeze,

        # Dataservices
        DataservicesScope.new('geocoding', 'Geocoding').freeze,
        DataservicesScope.new('isolines', 'Isolines').freeze,
        DataservicesScope.new('routing', 'Routing').freeze,
        DataservicesScope.new('observatory', 'Data Observatory').freeze,

        # User data
        UserScope.new('profile', 'User profile (avatar, name, org. owner)').freeze
      ].freeze

      SCOPES_BY_NAME = SCOPES.map { |s| [s.name, s] }.to_h.freeze

      # The default scope is always granted but cannot be explicitly requested
      SUPPORTED_SCOPES = (SCOPES.map(&:name) - [SCOPE_DEFAULT]).freeze

      def self.invalid_scopes(scopes)
        scopes - SUPPORTED_SCOPES - DatasetsScope.valid_scopes(scopes)
      end

      def self.invalid_scopes_and_tables(scopes, user)
        scopes - SUPPORTED_SCOPES - DatasetsScope.valid_scopes_with_table(scopes, user)
      end

      def self.build(scope)
        result = SCOPES_BY_NAME[scope]
        if !result && DatasetsScope.is_a?(scope)
          result = DatasetsScope.new(scope)
        end
        result
      end

      def self.scopes_by_category(new_scopes, previous_scopes)
        # If we had previous scopes, DEFAULT was already granted.
        if previous_scopes.present? && previous_scopes.any?
          previous_scopes << SCOPE_DEFAULT
        else
          previous_scopes = []
        end

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
        return [] if scopes1.nil? || scopes1.empty?
        return scopes1 if scopes2.nil? || scopes2.empty?

        datasets1, non_datasets1 = split_dataset_scopes_for_subtract(scopes1, user_schema)
        datasets2, non_datasets2 = split_dataset_scopes_for_subtract(scopes2, user_schema)

        datasets_results = []
        subtract_dataset_scopes(datasets1, datasets2)
        unless datasets1.empty?
          datasets1.each { |schema_table, permissions| datasets_results << "datasets:#{permissions}:#{schema_table}" }
        end

        datasets_results + (non_datasets1 - non_datasets2)
      end

      def self.split_dataset_scopes_for_subtract(scopes, user_schema)
        datasets = {}
        non_datasets = []

        scopes.each do |scope|
          if DatasetsScope.is_a?(scope)
            table, schema, permissions = DatasetsScope.table_schema_permission(scope)
            schema = user_schema if schema.nil?
            schema_table = "#{schema}.#{table}"

            should_be_rw = (datasets[schema_table].present? && datasets[schema_table] == 'rw') || permissions == 'rw'
            datasets[schema_table] = if should_be_rw
                                       'rw'
                                     else
                                       permissions
                                     end
          else
            non_datasets << scope
          end
        end

        [datasets, non_datasets]
      end

      def self.subtract_dataset_scopes(datasets1, datasets2)
        return [] if datasets1.nil?
        return datasets1 if datasets2.nil?

        datasets2.each do |schema_table, permissions|
          if datasets1[schema_table].present? && !(datasets1[schema_table] == 'rw' && permissions == 'r')
            datasets1.delete(schema_table)
          end
        end
      end

      class ScopesValidator < ActiveModel::EachValidator
        def validate_each(record, attribute, value)
          return record.errors[attribute] = ['has to be an array'] unless value && value.is_a?(Array)

          invalid_scopes = Scopes.invalid_scopes(value)
          record.errors[attribute] << "contains unsupported scopes: #{invalid_scopes.join(', ')}" if invalid_scopes.any?
        end
      end
    end
  end
end

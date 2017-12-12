require 'json'

module Carto
  class ApiKeyGrants
    ALLOWED_APIS = ['sql', 'maps'].freeze
    ALLOWED_PERMISSIONS = ['read', 'write'].freeze

    attr_reader :granted_apis, :table_permissions

    def initialize(grants_json)
      grants_json ||= []
      grants_json = JSON.parse(grants_json) unless grants_json.is_a?(Array)
      @granted_apis = []
      @table_permissions = {}
      grants_json.each { |grant| process_grant(grant) }
    end

    def process_grant(grant)
      type = grant['type']
      case type
        when 'apis'
          process_apis_grant(grant)
        when 'database'
          process_database_grant(grant)
        else
          raise InvalidArgument.new("Only 'apis' and 'database' grants are supported. '#{type}' given")
      end
    end

    def to_hash
      [granted_apis_hash, table_permissions_hash]
    end

    private

    def granted_apis_hash
      {
        'type' => 'apis',
        'apis' => granted_apis
      }
    end

    def table_permissions_hash
      tables = []
      table_permissions.each do |key, value|
        (schema, database) = key.split('.')
        tables << {
          'schema' => schema,
          'database' => database,
          'permissions' => value
        }
      end
      {
        'type' => 'database',
        'tables' => tables
      }
    end

    def process_apis_grant(grant)
      @granted_apis += grant['apis'].select { |api| ALLOWED_APIS.include?(api.downcase) }
    end

    def process_database_grant(grant)
      grant['tables'].each do |table|
        table_id = "#{table['schema']}.#{table['name']}"
        @table_permissions[table_id] ||= []
        permissions = table['permissions'].select { |p| ALLOWED_PERMISSIONS.include?(p.downcase) }
        permissions.each { |p| @table_permissions[table_id] << p.downcase unless @table_permissions.include?(p.downcase) }
      end
    end
  end
end

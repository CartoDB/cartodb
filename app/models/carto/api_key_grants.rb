require 'json'

module Carto
  class TablePermissions
    ALLOWED_PERMISSIONS = ['select', 'insert', 'update', 'delete', 'truncate', 'references', 'trigger'].freeze
    WRITE_PERMISSIONS = ['insert', 'update', 'delete', 'truncate'].freeze

    attr_reader :schema, :name, :permissions

    def initialize(schema:, name:, permissions: [])
      @schema = schema
      @name = name
      @permissions = permissions
    end

    def to_hash
      {
        'schema' => @schema,
        'name' => @name,
        'permissions' => @permissions
      }
    end

    def +(permissions)
      permissions = permissions.map { |p| p.downcase if ALLOWED_PERMISSIONS.include?(p.downcase) }
      @permissions += permissions.reject { |p| @permissions.include?(p) }
    end

    def <<(permission)
      permission = permission.downcase
      @permissions << permission if ALLOWED_PERMISSIONS.include? && !@permissions.include?(permission)
    end

    def write?
      !(@permissions & WRITE_PERMISSIONS).empty?
    end
  end

  class ApiKeyGrants
    ALLOWED_APIS = ['sql', 'maps'].freeze

    attr_reader :granted_apis

    def initialize(grants_json)
      grants_json ||= []
      grants_json = JSON.parse(grants_json) unless grants_json.is_a?(Array)
      @granted_apis = []
      @table_permissions = {}
      grants_json.each { |grant| process_grant(grant) }
    end

    def table_permissions
      @table_permissions.values
    end

    def to_hash
      [granted_apis_hash, table_permissions_hash]
    end

    private

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

    def granted_apis_hash
      {
        'type' => 'apis',
        'apis' => granted_apis
      }
    end

    def table_permissions_hash
      {
        'type' => 'database',
        'tables' => @table_permissions.values.map(&:to_hash)
      }
    end

    def process_apis_grant(grant)
      @granted_apis += grant['apis'].select { |api| ALLOWED_APIS.include?(api.downcase) }
    end

    def process_database_grant(grant)
      grant['tables'].each do |table|
        table_id = "#{table['schema']}.#{table['name']}"
        permissions = @table_permissions[table_id] ||= TablePermissions.new(schema: table['schema'], name: table['name'])
        permissions + table['permissions']
      end
    end
  end
end

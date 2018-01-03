require 'json'

module Carto
  class TablePermissions
    WRITE_PERMISSIONS = ['insert', 'update', 'delete', 'truncate'].freeze
    ALLOWED_PERMISSIONS = (WRITE_PERMISSIONS + ['select', 'references', 'trigger']).freeze

    attr_reader :schema, :name, :permissions

    def initialize(schema:, name:, permissions: [])
      @schema = schema
      @name = name
      @permissions = permissions
    end

    def to_json
      {
        'schema' => @schema,
        'name' => @name,
        'permissions' => @permissions
      }
    end

    def merge!(permissions)
      permissions = permissions.map { |p| p.downcase if ALLOWED_PERMISSIONS.include?(p.downcase) }
      @permissions += permissions.reject { |p| @permissions.include?(p) }
    end

    def write?
      !(@permissions & WRITE_PERMISSIONS).empty?
    end
  end

  class ApiKeyGrants
    ALLOWED_APIS = ['sql', 'maps'].freeze

    attr_reader :granted_apis

    def initialize(grants_json = [])
      @grants_json = grants_json
      @table_permissions = {}
      @granted_apis = []
      @errors = {}

      grants_json.each { |grant| process_grant(grant) }
    end

    def errors
      @errors
    end

    def table_permissions
      @table_permissions.values
    end

    def to_json
      @grants_json
    end

    private

    def process_grant(grant)
      type = grant[:type]
      case type
      when 'apis'
        @granted_apis += generate_apis_grant(grant[:apis])
      when 'database'
        process_database_grant(grant[:tables])
      end
    end

    def generate_apis_grant(grant)
      grant ||= []
      grant.select { |api| ALLOWED_APIS.include?(api.downcase) }
    end

    def process_database_grant(grant)
      grant.each do |table|
        table_id = "#{table[:schema]}.#{table[:name]}"
        permissions = @table_permissions[table_id] ||= TablePermissions.new(schema: table[:schema], name: table[:name])
        permissions.merge!(table[:permissions])
      end
    end
  end
end

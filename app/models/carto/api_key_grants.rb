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

    def initialize(db_connection:, db_role:, grants_json: [])
      @db_connection = db_connection
      @db_role = db_role
      @grants_json = grants_json
      @granted_apis = process_granted_apis(grants_json)
      @table_permissions = process_table_permissions(grants_json)
    end

    def table_permissions
      @table_permissions.values
    end

    def to_json
      @grants_json
    end

    private

    def process_granted_apis(grants_json)
      apis = grants_json.find { |v| v[:type] == 'apis' }[:apis]
      raise UnprocesableEntityError.new('apis array is needed for type "apis"') unless apis
      apis
    end

    def process_table_permissions(grants_json)
      table_permissions = {}

      databases = grants_json.find { |v| v[:type] == 'database' }
      return table_permissions unless databases.present?

      databases[:tables].each do |table|
        table_id = "#{table[:schema]}.#{table[:name]}"
        permissions = table_permissions[table_id] ||= TablePermissions.new(schema: table[:schema], name: table[:name])
        permissions.merge!(table[:permissions])
      end

      table_permissions
    end
  end
end

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

    def << (permission)
      down_permission = permission.downcase
      @permissions << down_permission if !@permissions.include?(down_permission) && ALLOWED_PERMISSIONS.include?(down_permission)
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

    def table_permissions(from_db: false)
      if from_db
        table_permissions_from_db
      else
        @table_permissions.values
      end
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

    def table_permissions_from_db
      permissions = {}
      roles_from_db.each do |line|
        permission_key = "#{line[:schema]}.#{line[:table_name]}"
        table_permission = permissions[permission_key] || permissions[permission_key] = TablePermissions.new(schema: line[:schema],
                                                                                                             name: line[:table_name]
        )
        table_permission << line[:permission]
      end
      permissions.values
    end

    def roles_from_db
      query = %{
        SELECT
          table_schema as schema,
          table_name,
          privilege_type as permission
        FROM
          information_schema.role_table_grants
        WHERE
          grantee = '#{@db_role}'
      }
      @db_connection.fetch(query).all
    end
  end
end

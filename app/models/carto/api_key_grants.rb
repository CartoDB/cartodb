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
      @granted_apis = []
      @table_permissions = {}

      # TODO: this should be removed when complete, previous json schema validation grants it
      unless grants_json.present? && grants_json.is_a?(Array)
        raise Carto::UnprocesableEntityError.new("grants must be a nonempty array")
      end

      grants_json.each { |grant| process_grant(grant) }
    end

    def table_permissions
      @table_permissions.values
    end

    def to_json
      [
        {
          type: 'apis',
          apis: granted_apis
        },
        {
          type: 'database',
          tables: @table_permissions.values.map(&:to_json)
        }
      ]
    end

    private

    def process_grant(grant)
      type = grant[:type]
      case type
      when 'apis'
        @granted_apis += generate_apis_grant(grant[:apis])
      when 'database'
        process_database_grant(grant[:tables])
      else
        raise Carto::UnprocesableEntityError.new("Only 'apis' and 'database' grants are supported. '#{type}' given")
      end
    end

    def generate_apis_grant(grant)
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

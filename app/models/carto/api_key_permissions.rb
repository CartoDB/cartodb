module Carto
  class ApiKeyPermissions
    attr_reader :name, :permissions

    def initialize(name:, permissions: [])
      @name = name
      @permissions = permissions
    end

    def merge!(permissions)
      down_permissions = permissions.map(&:downcase)
      @permissions += down_permissions.reject { |p| @permissions.include?(p) }
    end

    def write?
      !(@permissions & write_permissions).empty?
    end

    def write_permissions; end
  end

  class TablePermissions < ApiKeyPermissions
    WRITE_PERMISSIONS = ['insert', 'update', 'delete', 'truncate'].freeze

    attr_reader :schema, :owner

    def initialize(schema:, name:, owner: false, permissions: [])
      super(name: name, permissions: permissions)
      @schema = schema
      @owner = owner
    end

    def write_permissions
      WRITE_PERMISSIONS
    end
  end

  class SchemaPermissions < ApiKeyPermissions
    WRITE_PERMISSIONS = ['create'].freeze

    def write_permissions
      WRITE_PERMISSIONS
    end
  end
end

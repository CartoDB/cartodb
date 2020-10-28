module Carto
  class OrganizationPermission

    def add_read_permission(table)
      table.add_organization_read_permission
    end

    def add_read_write_permission(table)
      table.add_organization_read_write_permission
    end

  end
end

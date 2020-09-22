module Carto
  class UserPermission

    def initialize(user)
      @user = user
    end

    def is_permitted(table, access)
      table.permission.permitted?(@user, access)
    end

    def add_read_permission(table)
      table.add_read_permission(@user)
    end

    def add_read_write_permission(table)
      table.add_read_write_permission(@user)
    end

  end
end

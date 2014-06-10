# encoding: utf-8

module CartoDB
  class PermissionPresenter
    def initialize(permission)
      @permission = permission
    end

    def to_poro
      poro = {
        id:             @permission.id,
        owner: {
            id:         @permission.owner_id,
            username:   @permission.owner_username,
        },
        acl:            @permission.acl,
        created_at:     @permission.created_at,
        updated_at:     @permission.updated_at
      }
      poro
    end

  end
end


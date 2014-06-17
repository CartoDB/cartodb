# encoding: utf-8

require_relative 'permission_user_presenter'

module CartoDB
  class PermissionPresenter
    def initialize(permission)
      @permission = permission
      @user_presenter = CartoDB::PermissionUserPresenter.new
    end

    def to_poro
      {
        id:         @permission.id,
        owner:      @user_presenter.decorate(@permission.owner_id),
        entity: {
          id:       @permission.entity_id,
          type:     @permission.entity_type
        },
        acl:        @permission.acl.map { |entry|
          {
            type:   entry[:type],
            entity: @user_presenter.decorate(entry[:id]),
            access: entry[:access]
          }
        },
        created_at: @permission.created_at,
        updated_at: @permission.updated_at
      }
    end

  end
end


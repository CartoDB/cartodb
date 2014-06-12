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
        id:     @permission.id,
        owner:  @user_presenter.decorate(@permission.owner_id),
        acl:    @permission.acl.map { |entry|
          {
            user: @user_presenter.decorate(entry[:id]),
            type: entry[:type]
          }
        },
        created_at:     @permission.created_at,
        updated_at:     @permission.updated_at
      }
    end

  end
end


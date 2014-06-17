# encoding: utf-8

require_relative 'permission_user_presenter'

module CartoDB
  class PermissionPresenter
    def initialize(permission)
      @permission = permission
      @user_presenter = CartoDB::PermissionUserPresenter.new
      @org_presenter = CartoDB::PermissionOrganizationPresenter.new
    end

    def to_poro
      {
        id:     @permission.id,
        owner:  @user_presenter.decorate(@permission.owner_id),
        acl:    @permission.acl.map { |entry|
          {
            type:   entry[:type],
            entity: entity_decoration(entry),
            access: entry[:access]
          }
        },
        created_at:     @permission.created_at,
        updated_at:     @permission.updated_at
      }
    end

    def entity_decoration(entry)
      if entry[:type] == CartoDB::Permission::TYPE_USER
        @user_presenter.decorate(entry[:id])
      else
        @org_presenter.decorate(entry[:id])
      end
    end

  end
end


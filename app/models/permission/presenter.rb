require_relative 'permission_user_presenter'
require_relative 'permission_organization_presenter'
require_relative 'permission_group_presenter'

module CartoDB
  class PermissionPresenter
    def initialize(permission)
      @permission = permission
      @user_presenter = CartoDB::PermissionUserPresenter.new
      @org_presenter = CartoDB::PermissionOrganizationPresenter.new
    end

    def to_poro
      {
        id:         @permission.id,
        owner:      @user_presenter.decorate_user(@permission.owner),
        entity: {
          id:       @permission.entity_id,
          type:     @permission.entity_type
        },
        acl:        @permission.acl.map { |entry|
          entity = entity_decoration(entry)
          if entity.blank?
            nil
          else
            {
              type:   entry[:type],
              entity: entity,
              access: entry[:access]
            }
          end
        }.reject(&:nil?),
        created_at: @permission.created_at,
        updated_at: @permission.updated_at
      }
    end

    private

    def entity_decoration(entry)
      case entry[:type]
      when Carto::Permission::TYPE_USER
        @user_presenter.decorate(entry[:id])
      when Carto::Permission::TYPE_ORGANIZATION
        @org_presenter.decorate(entry[:id])
      when Carto::Permission::TYPE_GROUP
        CartoDB::PermissionGroupPresenter.new.decorate(entry[:id])
      else
        raise "Unknown entity type for entry #{entry}"
      end
    end

  end
end

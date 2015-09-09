require_relative 'user_presenter'

module Carto
  module Api
    class PermissionPresenter

      def initialize(permission)
        @permission = permission
      end

      def to_poro
        {
          id:         @permission.id,
          owner:      Carto::Api::UserPresenter.new(@permission.owner, { fetch_groups: false } ).to_poro,
          entity: {
            id:       @permission.entity_id,
            type:     @permission.entity_type
          },
          acl:        @permission.acl.map { |entry|
            {
              type:   entry[:type],
              entity: entity_decoration(entry),
              access: entry[:access]
            }
          },
          created_at: @permission.created_at,
          updated_at: @permission.updated_at
        }
      end

      def entity_decoration(entry)
        if entry[:type] == Carto::Permission::TYPE_USER
          user_decoration(entry[:id])
        elsif entry[:type] == Carto::Permission::TYPE_ORGANIZATION
          organization_decoration(entry[:id])
        elsif entry[:type] == Carto::Permission::TYPE_GROUP
          group_decoration(entry[:id])
        else
          raise "Unknown entity type: #{entry[:type]}"
        end
      end

      def user_decoration(user_id)
        user = User.where(id: user_id).first
        return {} if user.nil?
        {
            id:         user.id,
            username:   user.username,
            avatar_url: user.avatar_url,
            base_url:   user.public_url
        }
      end

      def organization_decoration(org_id)
        org = Carto::Organization.where(id: org_id).first
        return {} if org.nil?
        {
            id:         org.id,
            name:       org.name,
            avatar_url: org.avatar_url
        }
      end

      def group_decoration(group_id)
        group = Carto::Group.where(id: group_id).first
        return {} if group.nil?
        {
            id:         group.id,
            name:       group.name
        }
      end

    end
  end
end

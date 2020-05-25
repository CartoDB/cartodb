require_relative 'user_presenter'

module Carto
  module Api
    class PermissionPresenter

      def initialize(permission, current_viewer: nil, fetch_user_groups: false, fetch_db_size: true)
        @permission = permission
        @presenter_cache = Carto::Api::PresenterCache.new
        @current_viewer = current_viewer
        @fetch_user_groups = fetch_user_groups
        @fetch_db_size = fetch_db_size
      end

      def with_presenter_cache(presenter_cache)
        @presenter_cache = presenter_cache
        self
      end

      def to_poro
        return to_public_poro unless current_viewer && @permission.user_has_read_permission?(current_viewer)

        owner = @presenter_cache.get_poro(@permission.owner) do
          Carto::Api::UserPresenter.new(@permission.owner,
                                        fetch_groups: fetch_user_groups,
                                        current_viewer: current_viewer,
                                        fetch_profile: false,
                                        fetch_db_size: @fetch_db_size
                                        )
        end

        {
          id:         @permission.id,
          owner:      owner,
          entity: {
            id:       @permission.visualization.id,
            type:     'vis'
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

      def to_public_poro
        owner = @presenter_cache.get_poro(@permission.owner) do
          Carto::Api::UserPresenter.new(@permission.owner,
                                        fetch_groups: fetch_user_groups, current_viewer: current_viewer, fetch_db_size: @fetch_db_size)
        end

        {
          id:         @permission.id,
          owner:      owner
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
        user = ::User.where(id: user_id).first
        return {} if user.nil?
        Carto::Api::UserPresenter.new(user, fetch_groups: fetch_user_groups).to_public_poro
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

      private

      attr_reader :current_viewer, :fetch_user_groups
    end
  end
end

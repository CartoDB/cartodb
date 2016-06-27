require_relative 'user_presenter'

module Carto
  module Api
    class PermissionPresenter

      # options
      # - current_viewer
      def initialize(permission, options = {})
        @permission = permission
        @presenter_cache = Carto::Api::PresenterCache.new
        @options = options
      end

      def with_presenter_cache(presenter_cache)
        @presenter_cache = presenter_cache
        self
      end

      def to_poro
        return to_public_poro unless !@options[:current_viewer].nil? && @permission.user_has_read_permission?(@options[:current_viewer])

        owner = @presenter_cache.get_poro(@permission.owner) do
          Carto::Api::UserPresenter.new(@permission.owner, fetch_groups: false,
                                                           current_viewer: @options[:current_viewer])
        end

        {
          id:         @permission.id,
          owner:      owner,
          entity: {
            id:       @permission.visualization.id,
            type:     'vis'
          },
          acl:        @permission.acl.map do |entry|
            {
              type:   entry[:type],
              entity: entity_decoration(entry),
              access: entry[:access]
            }
          end,
          created_at: @permission.created_at,
          updated_at: @permission.updated_at
        }
      end

      def to_public_poro
        owner = @presenter_cache.get_poro(@permission.owner) do
          Carto::Api::UserPresenter.new(@permission.owner, fetch_groups: false,
                                                           current_viewer: @options[:current_viewer])
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

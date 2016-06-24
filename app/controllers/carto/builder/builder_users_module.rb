# encoding: utf-8

module Carto
  module Builder
    module BuilderUsersModule
      def builder_users_only
        render_404 unless current_user && builder_user?(current_user)
      end

      def builder_user?(user)
        manager_user(user).has_feature_flag?('editor-3')
      end

      def manager_user(user)
        org = user.organization
        org ? org.owner : user
      end
    end
  end
end

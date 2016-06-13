# encoding: utf-8

module Carto
  module Builder
    module BuilderUsersModule
      def builder_users_only
        render_404 unless current_user && builder_user?(current_user)
      end

      def builder_user?(user)
        user.has_feature_flag?('editor-3')
      end
    end
  end
end

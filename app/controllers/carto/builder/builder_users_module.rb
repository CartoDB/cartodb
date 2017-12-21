# encoding: utf-8

module Carto
  module Builder
    module BuilderUsersModule
      def builder_users_only
        unauthorized unless current_user && current_user.builder_enabled?
      end

      def unauthorized
        render_403
      end
    end
  end
end

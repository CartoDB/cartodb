# encoding: utf-8

module Carto
  module Builder
    module BuilderUsersModule
      def builder_users_only
        render_404 unless current_user && current_user.builder_enabled?
      end
    end
  end
end

require_relative './builder_users_module'

module Carto
  module Builder
    class BuilderController < ApplicationController
      include BuilderUsersModule

      before_filter :builder_users_only

      def unauthorized
        render_403
      end
    end
  end
end

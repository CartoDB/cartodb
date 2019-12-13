require_relative './builder_users_module'

module Carto
  module Builder
    class BuilderController < ApplicationController
      include BuilderUsersModule

      before_action :builder_users_only
    end
  end
end

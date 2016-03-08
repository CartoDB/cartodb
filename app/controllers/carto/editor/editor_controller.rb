require_relative './editor_users_module'

module Carto
  module Editor
    class EditorController < ApplicationController
      include EditorUsersModule

      before_filter :editor_users_only
    end
  end
end

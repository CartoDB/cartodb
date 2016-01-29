require_relative '../api/vizjson_presenter'

module Carto
  module Editor
    class EditorController < ApplicationController

      before_filter :editor_users_only

      private

      def editor_users_only
        render_404 unless current_user && editor_user?(current_user)
      end

      def editor_user?(user)
        user.has_feature_flag?('editor-3')
      end
    end
  end
end

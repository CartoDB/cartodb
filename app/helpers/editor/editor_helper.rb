module Editor
  module EditorHelper
    def editor_users_only
      render_pretty_404 unless editor_user?(current_user)
    end

    private

    def editor_user?(user)
      user.has_feature_flag?('editor-3')
    end
  end
end

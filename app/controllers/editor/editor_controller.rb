module Editor
  class EditorController < ApplicationController
    include EditorHelper

    before_filter :editor_users_only
  end
end

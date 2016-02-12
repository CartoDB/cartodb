# encoding: UTF-8

module Carto
  module Editor
    module Public
      class PublicController < EditorController
        before_filter :x_frame_options_deny

        protected

        def x_frame_options_deny
          response.headers['X-Frame-Options'] = 'DENY'
        end
      end
    end
  end
end

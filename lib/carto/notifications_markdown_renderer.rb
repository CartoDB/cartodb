require 'redcarpet/render_strip'

# A Redcarpet renderer that renders plain text, with a few modifications
# It is used to validate the length of the notifications messages, and check that the content is valid
module Carto
  class NotificationsMarkdownRenderer < Redcarpet::Render::StripDown
    def link(_link, _title, content)
      content
    end

    def image(_link, _title, _content)
      raise 'cannot contain images'
    end
  end
end

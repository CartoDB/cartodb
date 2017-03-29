require 'redcarpet/render_strip'

# A Redcarpet renderer that renders plain text, with a few modifications
# It is used to validate the length of the notifications messages, and check that the content is valid
module Carto
  class NotificationsMarkdownRenderer < Redcarpet::Render::StripDown
    def link(_link, _title, content)
      content
    end

    DISABLED_TAGS = [
      :block_code, :block_quote, :block_html, :footnotes, :footnote_def, :footnote_ref,
      :image, :header, :table, :table_row, :table_cell
    ].freeze

    # Defines a method that raises an error for each unsupported tag
    DISABLED_TAGS.each do |method|
      define_method method do |*_args|
        raise "cannot contain #{method.to_s.humanize.downcase}"
      end
    end
  end
end

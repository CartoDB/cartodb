require_relative '../../models/markdown_render'

module Carto::HtmlSafe
  def markdown_html_safe(text)
    if text.present?
      if is_mailto?(text)
        renderer = Redcarpet::Render::Safe.new()
      else
        renderer = Redcarpet::Render::Safe.new(link_attributes: { target: '_blank' })
      end
      markdown = Redcarpet::Markdown.new(renderer, extensions = {})
      markdown.render text
    end
  end

  def markdown_html_clean(text)
    if text.present?
      markdown_html_safe(text).strip_tags
    end
  end

  def is_mailto?(text)
    text && text.include?('mailto:')
  end
end

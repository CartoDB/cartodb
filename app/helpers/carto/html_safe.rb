require_relative '../../models/markdown_render'

module Carto::HtmlSafe
  def markdown_html_safe(text)
    if text.present?
      renderer = create_renderer(text)
      markdown = Redcarpet::Markdown.new(renderer, extensions = {})
      markdown.render text
    end
  end

  def create_renderer(text)
    if mailto?(text)
      Redcarpet::Render::Safe.new
    else
      Redcarpet::Render::Safe.new(link_attributes: { target: '_blank' })
    end
  end

  def markdown_html_clean(text)
    if text.present?
      markdown_html_safe(text).strip_tags
    end
  end

  def mailto?(text)
    text && text.include?('mailto:')
  end
end

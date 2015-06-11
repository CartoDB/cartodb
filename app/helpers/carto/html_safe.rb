require_relative '../../models/markdown_render'

module Carto::HtmlSafe

  def markdown_html_safe(text)
    if text.present?
      renderer = Redcarpet::Render::Safe
      markdown = Redcarpet::Markdown.new(renderer, extensions = {})
      markdown.render text 
    end
  end

  def markdown_html_clean(text)
    if text.present?
      markdown_html_safe(text).strip_tags
    end
  end

end

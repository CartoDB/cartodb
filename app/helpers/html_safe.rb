require_relative '../models/markdown_render'

module HtmlSafe

  def html_safe(text)
    if text.present?
      renderer = Redcarpet::Render::Safe
      markdown = Redcarpet::Markdown.new(renderer, extensions = {})
      markdown.render text 
    end
  end

  def html_clean(text)
    if text.present?
      html_safe(text).strip_tags
    end
  end

end

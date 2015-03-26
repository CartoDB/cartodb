require 'redcarpet'

class MarkdownRenderer < Redcarpet::Render::HTML
  def postprocess(full_document)
    Regexp.new(/\A<p>(.*)<\/p>\Z/m).match(full_document)[1] rescue full_document
  end
end


require 'redcarpet'

class MarkdownRenderer < Redcarpet::Render::HTML

  def postprocess(full_document)
    Regexp.new(%r{\A<p>(.*)</p>\Z}m).match(full_document)[1]
  rescue StandardError
    full_document
  end

end

require 'active_support/core_ext/object/blank'
require_relative '../../../app/helpers/carto/html_safe'

describe Carto::HtmlSafe do
  let(:html_safe) do
    class TestModule; include Carto::HtmlSafe; end.new
  end

  it 'sets target="blank" for links' do
    link = 'http://www.carto.com'
    html_safe.markdown_html_safe("[text](#{link})").should eq "<p><a href=\"#{link}\" target=\"_blank\">text</a></p>\n"
  end
end

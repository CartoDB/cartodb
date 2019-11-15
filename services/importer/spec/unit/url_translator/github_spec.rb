require_relative '../../../lib/importer/url_translator/github'

include CartoDB::Importer2
include UrlTranslator

describe GitHub do
  describe '#translate' do
    it 'returns a translated GitHub URL' do
      fixture     = 'https://github.com/benbalter/dc-wifi-social/blob' + 
                    '/master/bars.geojson?foo=bar'
      translated  = 'https://github.com/benbalter/dc-wifi-social/raw' + 
                    '/master/bars.geojson?foo=bar'
      GitHub.new.translate(fixture)
        .should eq translated
    end

    it 'returns the URL if already translated' do
      GitHub.new.translate('https://github.com/bogus/raw')
        .should eq 'https://github.com/bogus/raw'
    end

    it 'returns the URL if not supported' do
      GitHub.new.translate('http://www.google.com')
        .should eq 'http://www.google.com'
    end
  end #translate

  describe '#supported?' do
    it 'returns true if URL is from github.com' do
      GitHub.new
        .supported?('https://github.com/bogus/raw')
        .should eq true

      GitHub.new
        .translated?('https://github.com/bogus/master')
        .should eq false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL is already translated' do
      GitHub.new
        .translated?('https://github.com/bogus/raw')
        .should eq true

      GitHub.new
        .translated?('https://github.com/bogus/master')
        .should eq false
    end
  end  #translated?
end # GitHub


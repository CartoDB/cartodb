require_relative '../../../lib/importer/url_translator/osm'

include CartoDB::Importer2

describe UrlTranslator::OSM do
  describe '#translate' do
    it 'returns a translated OSM url' do
      url = "http://www.openstreetmap.org/?lat=40.01005&lon=-105.27517&zoom=15&layers=M"
      translated = UrlTranslator::OSM.new.translate(url)
      translated.should match /api.openstreetmap.org/
    end

    it 'returns the url if already translated' do
      translated = 'http://api.openstreetmap.org'
      UrlTranslator::OSM.new.translate(translated).should eq translated
    end

    it 'returns the url if not supported' do
      not_supported = 'http://bogus.com'
      UrlTranslator::OSM.new.translate(not_supported).should eq not_supported
    end
  end #translate

  describe '#bounding_box_for' do
    it 'returns a bouding box from a OSM url' do
      bounding_box = [
        -105.28804460327149,
        39.99932116394044,
        -105.26229539672852,
        40.02077883605958
      ]

      url = "http://www.openstreetmap.org/?lat=40.01005&lon=-105.27517&zoom=15&layers=M"
      UrlTranslator::OSM.new.bounding_box_for(url)
        .should eq bounding_box.join(',')
    end
  end #bounding_box_for

  describe '#supported?' do
    it 'returns true if URL is from OSM' do
      url = "http://www.openstreetmap.org/?lat=40.01005&lon=-105.27517&zoom=15&layers=M"
      UrlTranslator::OSM.new.supported?(url)
        .should eq true
      UrlTranslator::OSM.new.supported?('http://bogus.com')
        .should eq false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL already translated' do
      UrlTranslator::OSM.new.translated?('http://api.openstreetmap.org')
        .should eq true
      UrlTranslator::OSM.new.translated?('http://www.openstreetmap.org')
        .should eq false
    end
  end #translated?
end # UrlTranslator::OSM


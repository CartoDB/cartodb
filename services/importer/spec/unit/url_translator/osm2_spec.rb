require_relative '../../../lib/importer/url_translator/osm2'

include CartoDB::Importer2

describe UrlTranslator::OSM2 do
  describe '#translate' do
    it 'returns a translated OSM2 url' do
      url = "http://www.openstreetmap.org/#map=18/40.43494/-3.70068"
      translated = UrlTranslator::OSM2.new.translate(url)
      translated.should match /api.openstreetmap.org/
    end

    it 'returns a translated OSM2 url after Feb2014 url format changes' do
      url = "http://www.openstreetmap.org/export#map=18/40.43494/-3.70068"
      translated = UrlTranslator::OSM2.new.translate(url)
      translated.should match /api.openstreetmap.org/
    end


    it 'returns the url if already translated' do
      translated = 'http://api.openstreetmap.org'
      UrlTranslator::OSM2.new.translate(translated).should eq translated
    end

    it 'returns the url if not supported' do
      not_supported = 'http://bogus.com'
      UrlTranslator::OSM2.new.translate(not_supported).should eq not_supported
    end
  end #translate

  describe '#bounding_box_for' do
    it 'returns a bouding box from a OSM2 url' do
      bounding_box = [
        -3.702289325408941,
        40.43359889549254,
        -3.69907067459107,
        40.43628110450743
      ]

      url = "http://www.openstreetmap.org/#map=18/40.43494/-3.70068"
      UrlTranslator::OSM2.new.bounding_box_for(url)
        .should eq bounding_box.join(',')
    end
  end #bounding_box_for

  describe '#supported?' do
    it 'returns true if URL is from OSM2' do
      url = "http://www.openstreetmap.org/#map=18/40.43494/-3.70068"
      UrlTranslator::OSM2.new.supported?(url)
        .should eq true
      UrlTranslator::OSM2.new.supported?('http://bogus.com')
        .should eq false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL already translated' do
      UrlTranslator::OSM2.new.translated?('http://api.openstreetmap.org')
        .should eq true
      UrlTranslator::OSM2.new.translated?('http://www.openstreetmap.org')
        .should eq false
    end
  end #translated?
end # UrlTranslator::OSM2


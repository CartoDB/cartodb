require_relative '../../../lib/importer/url_translator/google_maps'

include CartoDB::Importer2

describe UrlTranslator::GoogleMaps do
  describe '#translate' do
    it 'returns a translated Google Maps url' do
      url = "https://maps.google.es/maps/ms?msid=215982527702589339532.0004e372ad34070ac8a80"+
            "&msa=0&ll=38.198684,-0.558001&spn=0.054973,0.077162"

      translated = UrlTranslator::GoogleMaps.new.translate(url)
      translated.should eq url + "&output=kml"
    end

    it 'returns the url if already translated' do
      translated = 'https://maps.google.es/maps/ms?msid=foo&output=kml'
      UrlTranslator::GoogleMaps.new.translate(translated)
        .should eq translated
    end

    it 'returns the url if not supported' do
      not_supported = 'http://bogus.com'
      UrlTranslator::GoogleMaps.new.translate(not_supported)
        .should eq not_supported
    end
  end #translate

  describe '#supported?' do
    it 'returns true if URL is from Google Maps' do
      UrlTranslator::GoogleMaps.new.supported?('http://maps.google.es/maps/ms?msid=foo')
        .should eq true
      UrlTranslator::GoogleMaps.new.supported?('http://bogus.com')
        .should eq false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL already translated' do
      UrlTranslator::GoogleMaps.new
        .translated?('https://maps.google.es/maps/ms?msid=foo&output=kml')
        .should eq true

      UrlTranslator::GoogleMaps.new
        .translated?('https://maps.google.es/maps/ms?msid=foo')
        .should eq false
    end
  end #translated?
end # UrlTranslator::Fusion Tables


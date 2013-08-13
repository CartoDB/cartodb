# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../../lib/importer/url_translator/google_maps'

include CartoDB::Importer2

describe UrlTranslator::GoogleMaps do
  describe '#translate' do
    it 'returns a translated Google Maps url' do
      url = "https://maps.google.es/maps/ms?msid=215982527702589339532.0004e372ad34070ac8a80"+
            "&msa=0&ll=38.198684,-0.558001&spn=0.054973,0.077162"

      translated = UrlTranslator::GoogleMaps.new.translate(url)
      translated.must_equal url + "&output=kml"
    end

    it 'returns the url if already translated' do
      translated = 'https://maps.google.es/maps/ms?msid=foo&output=kml'
      UrlTranslator::GoogleMaps.new.translate(translated)
        .must_equal translated
    end

    it 'returns the url if not supported' do
      not_supported = 'http://bogus.com'
      UrlTranslator::GoogleMaps.new.translate(not_supported)
        .must_equal not_supported
    end
  end #translate

  describe '#supported?' do
    it 'returns true if URL is from Google Maps' do
      UrlTranslator::GoogleMaps.new.supported?('http://maps.google.es/maps/ms?msid=foo')
        .must_equal true
      UrlTranslator::GoogleMaps.new.supported?('http://bogus.com')
        .must_equal false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL already translated' do
      UrlTranslator::GoogleMaps.new
        .translated?('https://maps.google.es/maps/ms?msid=foo&output=kml')
        .must_equal true

      UrlTranslator::GoogleMaps.new
        .translated?('https://maps.google.es/maps/ms?msid=foo')
        .must_equal false
    end
  end #translated?
end # UrlTranslator::Fusion Tables


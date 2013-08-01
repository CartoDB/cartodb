# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
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
        .must_equal translated
    end

    it 'returns the URL if already translated' do
      GitHub.new.translate('https://github.com/bogus/raw')
        .must_equal 'https://github.com/bogus/raw'
    end

    it 'returns the URL if not supported' do
      GitHub.new.translate('http://www.google.com')
        .must_equal 'http://www.google.com'
    end
  end #translate

  describe '#supported?' do
    it 'returns true if URL is from github.com' do
      GitHub.new
        .supported?('https://github.com/bogus/raw')
        .must_equal true

      GitHub.new
        .translated?('https://github.com/bogus/master')
        .must_equal false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL is already translated' do
      GitHub.new
        .translated?('https://github.com/bogus/raw')
        .must_equal true

      GitHub.new
        .translated?('https://github.com/bogus/master')
        .must_equal false
    end
  end  #translated?
end # GitHub


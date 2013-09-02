# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../../lib/importer/url_translator/google_docs'

include CartoDB::Importer2

describe UrlTranslator::GoogleDocs do
  describe '#translate' do
    it 'returns a translated Google Docs url' do
      url = 'https://docs.google.com/spreadsheet/ccc?' + 
            'key=0AjZkQrmSYqvxdHZ6T1ExUmF2bVQ3OUYxS0Q5dWl0dXc#gid=0'

      translated = UrlTranslator::GoogleDocs.new.translate(url)
      translated.must_match /output=csv/
    end

    it 'returns the url if already translated' do
      translated =  'https://docs.google.com/spreadsheet/pub?' +
                    'key=0AjZkQrmSYqvxdHZ6T1ExUmF2bVQ3OUYxS0Q5dWl0dXc&output=csv'
      UrlTranslator::GoogleDocs.new.translate(translated)
        .must_equal translated
    end

    it 'returns the url if not supported' do
      not_supported = 'http://bogus.com'
      UrlTranslator::GoogleDocs.new.translate(not_supported)
        .must_equal not_supported
    end
  end #translate

  describe '#supported?' do
    it 'returns true if URL is from Google Docs' do
      url = 'https://docs.google.com/spreadsheet/ccc?' + 
            'key=0AjZkQrmSYqvxdHZ6T1ExUmF2bVQ3OUYxS0Q5dWl0dXc#gid=0'
      UrlTranslator::GoogleDocs.new.supported?(url).must_equal true
      UrlTranslator::GoogleDocs.new.supported?('http://bogus.com')
        .must_equal false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL already translated' do
      translated =  'https://docs.google.com/spreadsheet/pub?' +
                    'key=0AjZkQrmSYqvxdHZ6T1ExUmF2bVQ3OUYxS0Q5dWl0dXc&output=csv'
      UrlTranslator::GoogleDocs.new.translated?(translated).must_equal true

      not_translated =  'https://docs.google.com/spreadsheet/ccc?' + 
                        'key=0AjZkQrmSYqvxdHZ6T1ExUmF2bVQ3OUYxS0Q5dWl0dXc#gid=0'
      UrlTranslator::GoogleDocs.new.translated?(not_translated)
        .must_equal false
    end
  end #translated?
end # UrlTranslator::Fusion Tables


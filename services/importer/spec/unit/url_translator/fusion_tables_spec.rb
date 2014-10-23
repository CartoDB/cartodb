# encoding: utf-8
require_relative '../../../lib/importer/url_translator/fusion_tables'

include CartoDB::Importer2

describe UrlTranslator::FusionTables do
  describe '#translate' do
    it 'returns a translated Fusion Tables url' do
      url1  = "https://www.google.com/fusiontables/DataSource?" +
              "docid=1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g#map:id=3"
      url2  = "https://www.google.com/fusiontables/data?" +
              "docid=1G0S0PVX2lD39uY6VC4VwYy2dbGGh8uHNG9bPxng#map:id=3"

      translated = UrlTranslator::FusionTables.new.translate(url1)
      translated.should eq "https://www.google.com/fusiontables/"  +
                            "exporttable?query=select+*+from+"      +
                            "1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"

      translated = UrlTranslator::FusionTables.new.translate(url2)
      translated.should eq "https://www.google.com/fusiontables/"  +
                            "exporttable?query=select+*+from+"      +
                            "1G0S0PVX2lD39uY6VC4VwYy2dbGGh8uHNG9bPxng"
    end

    it 'returns the url if already translated' do
      translated = 'http://google.com/fusiontables/exporttable'
      UrlTranslator::FusionTables.new.translate(translated)
        .should eq translated
    end

    it 'returns the url if not supported' do
      not_supported = 'http://bogus.com'
      UrlTranslator::FusionTables.new.translate(not_supported)
        .should eq not_supported
    end
  end #translate

  describe '#supported?' do
    it 'returns true if URL is from Fusion Tables' do
      UrlTranslator::FusionTables.new.supported?('http://google.com/fusiontables')
        .should eq true
      UrlTranslator::FusionTables.new.supported?('http://bogus.com')
        .should eq false
    end
  end #supported?

  describe '#translated?' do
    it 'returns true if URL already translated' do
      UrlTranslator::FusionTables.new
        .translated?('http://google.com/fusiontables/exporttable')
        .should eq true

      UrlTranslator::FusionTables.new
        .translated?('http://google.com/fusiontables')
        .should eq false
    end
  end #translated?
end # UrlTranslator::Fusion Tables


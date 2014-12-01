# encoding: utf-8
require_relative '../../../lib/importer/url_translator/fusion_tables'

include CartoDB::Importer2

describe UrlTranslator::FusionTables do
  url1  = "https://www.google.com/fusiontables/DataSource?" +
          "docid=1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g#map:id=3"
  url2  = "https://www.google.com/fusiontables/data?" +
          "docid=1G0S0PVX2lD39uY6VC4VwYy2dbGGh8uHNG9bPxng#map:id=3"
  url2_translation = "https://www.google.com/fusiontables/"  +
                        "exporttable?query=select+*+from+"      +
                        "1G0S0PVX2lD39uY6VC4VwYy2dbGGh8uHNG9bPxng"
  url2_without_map_id  = "https://www.google.com/fusiontables/data?" +
          "docid=1G0S0PVX2lD39uY6VC4VwYy2dbGGh8uHNG9bPxng"

  url2_without_docid  = "https://www.google.com/fusiontables/data?" +
          "nodocid=1G0S0PVX2lD39uY6VC4VwYy2dbGGh8uHNG9bPxng"

  url_with_content = 'https://fusiontables.googleusercontent.com/fusiontables/embedviz?' +
      'viz=GVIZ&t=TABLE&q=select+col1,+col2,+col3+from+' +
      '17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw+where+col1+in+' +
      '(%27Minnesota%27,+%27Mississippi%27)&containerId=googft-gviz-canvas'

  url_with_query = 'https://www.google.com/fusiontables/embedviz?' +
      'viz=GVIZ&t=TABLE&q=select+col1%2C+col2%2C+col3+' +
      'from+17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw+where+col1+' +
      "in+('Minnesota'%2C+'Mississippi')&containerId=googft-gviz-canvas"
  url_with_query_translation = 'https://www.google.com/fusiontables/' +
      'exporttable?query=select+col1%2C+col2%2C+col3+' +
      'from+17aT9Ud-YnGiXdXEJUyycH2ocUqreOeKGbzCkUw+where+col1+' +
      "in+('Minnesota'%2C+'Mississippi')&containerId=googft-gviz-canvas"

  describe '#translate' do
    it 'returns a translated Fusion Tables url' do
      translated = UrlTranslator::FusionTables.new.translate(url1)
      translated.should eq "https://www.google.com/fusiontables/"  +
                            "exporttable?query=select+*+from+"      +
                            "1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"

      translated = UrlTranslator::FusionTables.new.translate(url2)
      translated.should eq url2_translation

      translated = UrlTranslator::FusionTables.new.translate(url2_without_map_id)
      translated.should eq url2_translation
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

    it 'does not supports user content' do
      UrlTranslator::FusionTables.new.supported?(url_with_content).should eq false
    end

    it 'supports url with table query' do
      UrlTranslator::FusionTables.new.supported?(url_with_query).should eq true
    end

    it 'translates url table query' do
      UrlTranslator::FusionTables.new.translate(url_with_query).should eq url_with_query_translation
    end

    it 'fails if url does not contain docid' do
      expect { UrlTranslator::FusionTables.new.translate(url2_without_docid) }.to raise_error
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


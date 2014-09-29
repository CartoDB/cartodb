# encoding: utf-8

require_relative '../../lib/datasources'

include CartoDB::Datasources

describe Url::ArcGIS do

  before(:each) do
    Typhoeus::Expectation.clear
  end

  describe '#set_data_from' do
    it 'tests preparing the correct url from the one given from the UI' do
      invalid_1 = 'http://myserver/services/MyFakeService/featurename/MapServer'
      invalid_2 = 'myserver/services/MyFakeService/featurename/MapServer'

      test0 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename'
      test1 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/'
      test2 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer'
      test3 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/'
      test4 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0'
      test5 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0?'
      test6 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0?q=blablabla'

      valid = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0'

      # Should be treated as ok
      test7   = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/2314/'
      valid_7 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/2314/MapServer/0'

      arcgis = Url::ArcGIS.get_new

      expect {
        arcgis.send(:sanitize_id, invalid_1)
      }.to raise_error InvalidInputDataError
      expect {
        arcgis.send(:sanitize_id, invalid_2)
      }.to raise_error InvalidInputDataError

      arcgis.send(:sanitize_id, test0).should eq valid
      arcgis.send(:sanitize_id, test1).should eq valid
      arcgis.send(:sanitize_id, test2).should eq valid
      arcgis.send(:sanitize_id, test3).should eq valid
      arcgis.send(:sanitize_id, test4).should eq valid
      arcgis.send(:sanitize_id, test5).should eq valid
      arcgis.send(:sanitize_id, test6).should eq valid
      arcgis.send(:sanitize_id, test7).should eq valid_7
    end
  end

  describe '#get_resource_metadata' do
    it 'tests error scenarios' do
      url = 'http://myserver/arcgis/rest/services/MyFakeService/featurename'

      arcgis = Url::ArcGIS.get_new

      # 'general http error (non-200)'
      Typhoeus.stub(/\/arcgis\/rest\//) do
        Typhoeus::Response.new(
          code: 400,
          headers: { 'Content-Type' => 'application/json' },
          body: ''
        )
      end

      expect {
        arcgis.get_resource_metadata(url)
      }.to raise_error DataDownloadError

      # 'fields' part
      Typhoeus::Expectation.clear
      Typhoeus.stub(/\/arcgis\/rest\//) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_metadata_minimal.json"))

        body = ::JSON.parse(body)
        body.delete('fields')
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      expect {
        arcgis.get_resource_metadata(url)
      }.to raise_error ResponseError


      # Another required field
      Typhoeus::Expectation.clear
      Typhoeus.stub(/\/arcgis\/rest\//) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_metadata_minimal.json"))

        body = ::JSON.parse(body)
        body.delete('name')
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      expect {
        arcgis.get_resource_metadata(url)
      }.to raise_error ResponseError

      # Invalid ArcGIS version
      Typhoeus::Expectation.clear
      Typhoeus.stub(/\/arcgis\/rest\//) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_metadata_minimal.json"))

        body = ::JSON.parse(body)
        body['currentVersion'] = 9.0
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      expect {
        arcgis.get_resource_metadata(url)
      }.to raise_error InvalidServiceError

    end

    it 'tests metadata retrieval' do
      url = 'http://myserver/arcgis/rest/services/MyFakeService/featurename'

      arcgis = Url::ArcGIS.get_new

      Typhoeus.stub(/\/arcgis\/rest\//) do |request|
        accept = (request.options[:headers]||{})['Accept'] || 'application/json'
        format = accept.split(',').first

        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_metadata_minimal.json"))

        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => format },
          body: body
        )
      end

      expected_metadata = {
        :arcgis_version=>10.22,
        :name=>"Test Feature",
        :description=>"Sample metadata payload",
        :type=>"Feature Layer",
        :geometry_type=>"esriGeometryPolygon",
        :copyright=>"CartoDB",
        :fields=>[
          {
            :name => "OBJECTID",
            :type => "esriFieldTypeOID"
          },
          {
            :name => "NAME",
            :type => "esriFieldTypeString"
          }
        ],
        :max_records_per_query=>1000,
        :supported_formats=>["JSON", "AMF"],
        :advanced_queries_supported=>true
      }

      expected_metadata_response = {
        id:       url,
        title:    'Test Feature',
        url:      nil,
        service:  Url::ArcGIS::DATASOURCE_NAME,
        checksum: nil,
        size:     0,
        filename: 'test_feature'
      }

      response = arcgis.get_resource_metadata(url)

      response.nil?.should be false
      arcgis.metadata.should eq expected_metadata

      response.should eq expected_metadata_response
    end
  end

end


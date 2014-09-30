# encoding: utf-8

require_relative '../../lib/datasources'

include CartoDB::Datasources

describe Url::ArcGIS do

  before(:all) do
    @url = 'http://myserver/arcgis/rest/services/MyFakeService/featurename'
  end

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
        arcgis.get_resource_metadata(@url)
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
        arcgis.get_resource_metadata(@url)
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
        arcgis.get_resource_metadata(@url)
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
        arcgis.get_resource_metadata(@url)
      }.to raise_error InvalidServiceError

    end

    it 'tests metadata retrieval' do
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
        id:       @url,
        title:    'Test Feature',
        url:      nil,
        service:  Url::ArcGIS::DATASOURCE_NAME,
        checksum: nil,
        size:     0,
        filename: 'test_feature.json'
      }

      response = arcgis.get_resource_metadata(@url)

      response.nil?.should be false
      arcgis.metadata.should eq expected_metadata

      response.should eq expected_metadata_response
    end
  end

  describe '#get_resource' do
    it 'tests the get_ids_list() private method with error scenarios' do
      arcgis = Url::ArcGIS.get_new

      id = arcgis.send(:sanitize_id, @url)

      # 'general http error (non-200)'
      Typhoeus.stub(/\/arcgis\/rest\//) do
        Typhoeus::Response.new(
          code: 400,
          headers: { 'Content-Type' => 'application/json' },
          body: ''
        )
      end

      expect {
        arcgis.send(:get_ids_list, id)
      }.to raise_error DataDownloadError

      # 'objectIds' not present
      Typhoeus::Expectation.clear
      Typhoeus.stub(/\/arcgis\/rest\//) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_ids_list.json"))

        body = ::JSON.parse(body)
        body.delete('objectIds')
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      expect {
        arcgis.send(:get_ids_list, id)
      }.to raise_error ResponseError

      # 'objectIds' empty
      Typhoeus::Expectation.clear
      Typhoeus.stub(/\/arcgis\/rest\//) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_ids_list.json"))

        body = ::JSON.parse(body)
        body['objectIds'] = []
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      expect {
        arcgis.send(:get_ids_list, id)
      }.to raise_error ResponseError

    end

    it 'tests the get_ids_list() private method' do
      arcgis = Url::ArcGIS.get_new

      id = arcgis.send(:sanitize_id, @url)

      Typhoeus.stub(/\/arcgis\/rest\//) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_ids_list.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: body
        )
      end

      expected_ids = [1,2,3,4,5,6,7,8,9,10]

      respose_ids = arcgis.send(:get_ids_list, id)

      respose_ids.nil?.should be false
      respose_ids.should eq expected_ids
    end

    it 'tests the get_by_ids() private method with error scenarios' do
      arcgis = Url::ArcGIS.get_new

      id = arcgis.send(:sanitize_id, @url)

      # Empty ids
      expect {
        arcgis.send(:get_by_ids, id, [], [{ key: 'value' }])
      }.to raise_error InvalidInputDataError

      # Empty fields
      expect {
        arcgis.send(:get_by_ids, id, [1], [])
      }.to raise_error InvalidInputDataError


      # 'general http error (non-200)'
      Typhoeus.stub(/\/arcgis\/rest\//) do
        Typhoeus::Response.new(
          code: 400,
          headers: { 'Content-Type' => 'application/json' },
          body: ''
        )
      end

      expect {
        arcgis.send(:get_by_ids, id, [1], [{ key: 'value' }])
      }.to raise_error DataDownloadError
    end

    it 'tests the get_by_ids() private method' do
      arcgis = Url::ArcGIS.get_new

      id = arcgis.send(:sanitize_id, @url)

      Typhoeus.stub(/\/arcgis\/rest\//) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_data_01.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: body
        )
      end

      expected_response_data = {
        geometryType: "esriGeometryPolygon",
        spatialReference: {
          "wkid" => 4326,
          "latestWkid" => 4326
        },
        fields: [
          {
            "name" => "OBJECTID",
            "type" => "esriFieldTypeOID",
            "alias" => "OBJECTID"
          },
          {
            "name" => "WDPAID",
            "type" => "esriFieldTypeInteger",
            "alias" => "WDPAID"
          },
          {
            "name" => "NAME",
            "type" => "esriFieldTypeString",
            "alias" => "NAME",
            "length" => 254
          }
        ],
        features: [
          {"attributes"=>{"OBJECTID"=>1, "NAME"=>"Name of object 1"}, "geometry"=>{"fake"=>"geom"}},
          {"attributes"=>{"OBJECTID"=>2, "NAME"=>"Name of object 2"}, "geometry"=>{"fake"=>"geom"}},
          {"attributes"=>{"OBJECTID"=>3, "NAME"=>"Name of object 3"}, "geometry"=>{"fake"=>"geom"}}
        ]
      }

      ids_to_retrieve = [1,2,3]
      # WDPAID also present, but left on purpose untouched
      fields_to_retrieve = [{
                              name: 'OBJECTID',
                              type: 'esriFieldTypeOID'
                            },
                            {
                              name: 'NAME',
                              type: 'esriFieldTypeString'
                            }]

      response_data = arcgis.send(:get_by_ids, id, ids_to_retrieve, fields_to_retrieve)

      response_data.nil?.should eq false
      response_data[:features].length.should eq 3

      response_data.should eq expected_response_data

    end

    it 'tests the get_resource() method (does not check actual stored data)' do
      arcgis = Url::ArcGIS.get_new

      id = arcgis.send(:sanitize_id, @url)

      Typhoeus.stub(/\/arcgis\/rest\/(.*)\?f=json/) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_metadata_minimal.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: body
        )
      end

      Typhoeus.stub(/\/arcgis\/rest\/(.*)query\?where=/) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_ids_list_01.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: body
        )
      end

      # First item fetch
      Typhoeus.stub(/\/arcgis\/rest\/(.*)query\?objectIds=1&outFields/) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_data_01.json"))
        body = ::JSON.parse(body)

        body['features'] = [ body['features'][0] ]

        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      # Remaining items fetch
      Typhoeus.stub(/\/arcgis\/rest\/(.*)query\?objectIds=2%2C3&outFields/) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_data_01.json"))
        body = ::JSON.parse(body)

        body['features'] = [ body['features'][1], body['features'][2] ]

        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      # Needed to set the metadata
      arcgis.get_resource_metadata(id)

      results = arcgis.get_resource(id)

      # [ total_ids, processed_ids ]
      results.should eq [3, 3]
    end

  end




end


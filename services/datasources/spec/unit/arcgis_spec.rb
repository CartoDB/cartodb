# encoding: utf-8

require 'active_support/core_ext'

require_relative '../../lib/datasources'
require_relative '../doubles/user'

include CartoDB::Datasources

describe Url::ArcGIS do

  before(:all) do
    @url = 'http://myserver/arcgis/rest/services/MyFakeService/featurename'
    @invalid_url = 'http://myserver/mysite/rest/myfakefolder/MyFakeService/featurename'
    @user = CartoDB::Datasources::Doubles::User.new
  end

  before(:each) do
    Typhoeus::Expectation.clear
  end

  describe '#set_data_from' do
    it 'tests preparing the correct url from the one given from the UI' do
      invalid_1 = 'http://myserver/services/MyFakeService/featurename/MapServer'
      invalid_2 = 'myserver/services/MyFakeService/featurename/MapServer'

      test1 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer'
      test2 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/'
      test3 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0'
      test4 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0?'
      test5 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0?q=blablabla'
      test6 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer?q=blablabla'

      valid_map = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer'
      valid_map_trailing_slash = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/'
      valid_layer = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/MapServer/0'

      # Should be treated as ok
      test7   = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/2314/'
      valid_7 = 'http://myserver/arcgis/rest/services/MyFakeService/featurename/2314/'

      arcgis = Url::ArcGIS.get_new(@user)

      expect {
        arcgis.send(:sanitize_id, invalid_1)
      }.to raise_error InvalidInputDataError
      expect {
        arcgis.send(:sanitize_id, invalid_2)
      }.to raise_error InvalidInputDataError

      arcgis.send(:sanitize_id, test1).should eq valid_map
      arcgis.send(:sanitize_id, test2).should eq valid_map_trailing_slash
      arcgis.send(:sanitize_id, test3).should eq valid_layer
      arcgis.send(:sanitize_id, test4).should eq valid_layer
      arcgis.send(:sanitize_id, test5).should eq valid_layer
      arcgis.send(:sanitize_id, test6).should eq valid_map
      arcgis.send(:sanitize_id, test7).should eq valid_7
    end
  end

  describe '#get_resource_metadata' do
    it 'tests error scenarios' do
      arcgis = Url::ArcGIS.get_new(@user)

      sub_id = '0'

      # 'general http error (non-200)'
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/layers/) do
        Typhoeus::Response.new(
          code: 400,
          headers: { 'Content-Type' => 'application/json' },
          body: ''
        )
      end

      expect {
        arcgis.get_resource_metadata(@url)
      }.to raise_error DataDownloadError

      # Stub layers request (so now works)
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/layers/) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_layers.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(::JSON.parse(body))
        )
      end

      layers_data = arcgis.get_resource_metadata(@url)
      layers_data_expected = {
        id:           @url,
        subresources: [{
          id: "#{@url}/#{sub_id}",
          title: 'first layer'
        }]
      }
      layers_data.should eq layers_data_expected

      # 'fields' part
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/0/) do |request|
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
        arcgis.send(:get_subresource_metadata, @url, sub_id)
      }.to raise_error ResponseError

      # Another required field
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/0/) do |request|
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
        arcgis.send(:get_subresource_metadata, @url, sub_id)
      }.to raise_error ResponseError

      # Invalid ArcGIS version
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/0/) do |request|
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
        arcgis.send(:get_subresource_metadata, @url, sub_id)
      }.to raise_error InvalidServiceError

      # Invalid ArcGIS URL
      expect {
        arcgis.send(:get_resource_metadata, @invalid_url)
      }.to raise_error InvalidInputDataError
    end

    it 'tests metadata retrieval' do
      arcgis = Url::ArcGIS.get_new(@user)

      # Stub layers request (so now works)
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/layers/) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_layers.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(::JSON.parse(body))
        )
      end

      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/0/) do |request|
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
        id:       @url + '/0',
        title:    'Test Feature',
        url:      nil,
        service:  Url::ArcGIS::DATASOURCE_NAME,
        checksum: nil,
        size:     0,
        filename: 'test_feature.json'
      }

      # Multi-resource scenario already tested above
      response = arcgis.get_resource_metadata(@url + '/0')

      response.nil?.should be false
      arcgis.metadata.should eq expected_metadata

      response.should eq expected_metadata_response
    end
  end

  describe '#get_resource' do
    it 'tests the get_ids_list() private method with error scenarios' do
      arcgis = Url::ArcGIS.get_new(@user)

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
      arcgis = Url::ArcGIS.get_new(@user)

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

    it 'tests the get_ids_list() private method on out-of-order ids' do
      arcgis = Url::ArcGIS.get_new(@user)

      id = arcgis.send(:sanitize_id, @url)

      Typhoeus.stub(/\/arcgis\/rest\//) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_unordered_ids_list.json"))
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
      arcgis = Url::ArcGIS.get_new(@user)

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
      arcgis = Url::ArcGIS.get_new(@user)

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

    it 'tests retrieval of data' do
      arcgis = Url::ArcGIS.get_new(@user)

      feature_names = []

      # Layers request
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/layers/) do |request|
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_layers.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(::JSON.parse(body))
        )
      end

      # Metadata of a layer
      Typhoeus.stub(/\/arcgis\/rest\/services\/MyFakeService\/featurename\/0\?f=json/) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_metadata_minimal.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: body
        )
      end

      # IDs list of a layer
      Typhoeus.stub(/\/arcgis\/rest\/(.*)query\?where=/) do
        body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_ids_list_01.json"))
        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: body
        )
      end

      Typhoeus.stub(/\/arcgis\/rest\/(.*)query$/) do |response|
        if response.options[:body][:objectIds].to_i == 1
          # First item fetch of a layer
          body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_data_01.json"))
          body = ::JSON.parse(body)

          feature_names.push body['features'][0]['attributes']['NAME']
          body['features'] = [ body['features'][0] ]
        else
          # Remaining items fetch of a layer, will not use :objectIds
          body = File.read(File.join(File.dirname(__FILE__), "../fixtures/arcgis_data_01.json"))
          body = ::JSON.parse(body)

          feature_names.push body['features'][1]['attributes']['NAME']
          feature_names.push body['features'][2]['attributes']['NAME']
          body['features'] = [ body['features'][1], body['features'][2] ]
        end

        Typhoeus::Response.new(
          code: 200,
          headers: { 'Content-Type' => 'application/json' },
          body: ::JSON.dump(body)
        )
      end

      # 1) Retrieve lists of layers
      metadata = arcgis.get_resource_metadata(@url)

      # 2) Retrieve metadata of a specific layer (doesn't adds much, but to replicate flow)
      item_metadata = arcgis.get_resource_metadata(metadata[:subresources].first[:id])

      item_metadata.nil?.should eq false
      # No more checks as will fail later if missing something

      spatial_ref_expectation = {"wkid"=>4326, "latestWkid"=>4326}

      initial_stream_data = arcgis.initial_stream(item_metadata[:id])

      initial_stream_data.nil?.should eq false
      initial_stream_data = ::JSON.parse(initial_stream_data)
      initial_stream_data['geometryType'].should eq 'esriGeometryPolygon'
      initial_stream_data['spatialReference'].should eq spatial_ref_expectation
      initial_stream_data['fields'].count.should eq 3
      initial_stream_data['fields'][0]['name'].should eq 'OBJECTID'
      initial_stream_data['fields'][1]['name'].should eq 'WDPAID'
      initial_stream_data['fields'][2]['name'].should eq 'NAME'
      initial_stream_data['features'].count.should eq 1
      initial_stream_data['features'][0]['attributes'].nil?.should eq false
      initial_stream_data['features'][0]['attributes']['NAME'].should eq feature_names[0]
      initial_stream_data['features'][0]['geometry'].nil?.should eq false

      streamed_data = arcgis.stream_resource(item_metadata[:id])

      streamed_data.nil?.should eq false
      streamed_data = ::JSON.parse(streamed_data)
      streamed_data['geometryType'].should eq 'esriGeometryPolygon'
      streamed_data['spatialReference'].should eq spatial_ref_expectation
      streamed_data['fields'].count.should eq 3
      streamed_data['fields'][0]['name'].should eq 'OBJECTID'
      streamed_data['fields'][1]['name'].should eq 'WDPAID'
      streamed_data['fields'][2]['name'].should eq 'NAME'
      streamed_data['features'].count.should eq 2
      streamed_data['features'][0]['attributes']['NAME'].should eq feature_names[1]
      streamed_data['features'][1]['attributes']['NAME'].should eq feature_names[2]

    end
  end
end

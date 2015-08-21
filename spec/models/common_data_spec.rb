# coding: UTF-8
require_relative '../spec_helper'

describe CommonData do

  before(:each) do
    Typhoeus::Expectation.clear
    @common_data = CommonData.new
    @common_data.stubs(:config).with('protocol', 'https').returns('https')
    @common_data.stubs(:config).with('username').returns('common-data')
    @common_data.stubs(:config).with('host').returns('example.com')
    @common_data.stubs(:config).with('api_key').returns('wadus')
    @common_data.stubs(:config).with('format', 'shp').returns('shp')
  end

  after(:all) do
    Typhoeus::Expectation.clear
  end

  it 'should return empty datasets response and notify error for SQL API error response' do
    stub_api_response(503)
    CartoDB.expects(:notify_error).with('common-data empty', { rows: [] })

    @common_data.datasets.should eq CommonData::DATASETS_EMPTY
  end

  it 'should return empty datasets and notify error for invalid json' do
    stub_api_response(200, INVALID_JSON_RESPONSE)
    CartoDB.expects(:notify_error).with('common-data empty', { rows: [] })

    @common_data.datasets.should eq CommonData::DATASETS_EMPTY
  end

  it 'should return correct categories and datasets for default stub response' do
    stub_valid_api_response
    CartoDB.expects(:notify_error).times(0)

    @common_data.datasets[:datasets].size.should eq 7
    @common_data.datasets[:categories].size.should eq 3
  end

  it 'should use SQL API V2 for export URLs' do
    stub_valid_api_response

    @common_data.datasets[:datasets].first['url'].should match /^https:\/\/common-data\.example\.com\/api\/v2/
  end

  def stub_valid_api_response
    stub_api_response(200, VALID_JSON_RESPONSE)
  end

  def stub_api_response(code, body=nil)
    if body
      response = Typhoeus::Response.new(code: code, body: body)
    else
      response = Typhoeus::Response.new(code: code)
    end
    Typhoeus.stub(/common-data/).and_return(response)
  end

  VALID_JSON_RESPONSE = <<-response
{
  "rows": [
    {
      "name": "New York Counties",
      "tabname": "counties_ny",
      "description": "All the New York counties",
      "source": null,
      "license": null,
      "attributions": null,
      "rows": 62,
      "size": 65536,
      "created_at": "2014-09-08T12:09:46Z",
      "updated_at": "2014-09-08T12:14:12Z",
      "category": "Administrative regions",
      "category_image_url": "https://s3.amazonaws.com/common-data.cartodb.net/administrative.png"
    },
    {
      "name": "World borders",
      "tabname": "world_borders",
      "description": "World countries borders",
      "source": null,
      "license": null,
      "attributions": null,
      "rows": 246,
      "size": 450560,
      "created_at": "2014-09-08T10:15:54Z",
      "updated_at": "2014-09-08T12:14:23Z",
      "category": "Administrative regions",
      "category_image_url": "https://s3.amazonaws.com/common-data.cartodb.net/administrative.png"
    },
    {
      "name": "Urban Areas",
      "tabname": "table_50m_urban_area",
      "description": "Areas of human habitation",
      "source": "[Naturalearthdata](http://naturalearthdata.com)",
      "license": null,
      "attributions": null,
      "rows": 2143,
      "size": 1556480,
      "created_at": "2014-09-08T12:15:09Z",
      "updated_at": "2014-09-08T12:16:00Z",
      "category": "Cultural datasets",
      "category_image_url": "https://s3.amazonaws.com/common-data.cartodb.net/cultural_bkg.jpg"
    },
    {
      "name": "Populated places",
      "tabname": "ne_10m_populated_places_simple",
      "description": "Most populated places",
      "source": "[Naturalearthdata](http://naturalearthdata.com)",
      "license": null,
      "attributions": null,
      "rows": 7313,
      "size": 2588672,
      "created_at": "2014-09-08T12:16:29Z",
      "updated_at": "2014-09-08T12:17:01Z",
      "category": "Cultural datasets",
      "category_image_url": "https://s3.amazonaws.com/common-data.cartodb.net/cultural_bkg.jpg"
    },
    {
      "name": "World rivers",
      "tabname": "table_50m_rivers_lake_centerlines_with_scale_r",
      "description": "Most of the world rivers",
      "source": "[Naturalearthdata](http://naturalearthdata.com)",
      "license": null,
      "attributions": null,
      "rows": 1611,
      "size": 1163264,
      "created_at": "2014-09-08T12:17:18Z",
      "updated_at": "2014-09-08T12:18:16Z",
      "category": "Cities buildings, roads and POI’s",
      "category_image_url": "https://s3.amazonaws.com/common-data.cartodb.net/natural_bkg.jpg"
    },
    {
      "name": "NYC Subways",
      "tabname": "nyc_subway_entrance",
      "description": "All the NYC Subways",
      "source": null,
      "license": null,
      "attributions": null,
      "rows": 1904,
      "size": 417792,
      "created_at": "2014-09-08T12:18:36Z",
      "updated_at": "2014-09-08T12:19:28Z",
      "category": "Cultural datasets",
      "category_image_url": "https://s3.amazonaws.com/common-data.cartodb.net/cultural_bkg.jpg"
    },
    {
      "name": "European countries",
      "tabname": "european_countries",
      "description": "European countries geometries",
      "source": null,
      "license": null,
      "attributions": null,
      "rows": 46,
      "size": 245760,
      "created_at": "2014-09-08T12:19:41Z",
      "updated_at": "2014-09-08T12:20:27Z",
      "category": "Administrative regions",
      "category_image_url": "https://s3.amazonaws.com/common-data.cartodb.net/administrative.png"
    }
  ],
  "time": 0.013,
  "fields": {
    "name": {
      "type": "string"
    },
    "tabname": {
      "type": "string"
    },
    "description": {
      "type": "string"
    },
    "source": {
      "type": "string"
    },
    "license": {
      "type": "string"
    },
    "attributions": {
      "type": "string"
    },
    "rows": {
      "type": "number"
    },
    "size": {
      "type": "number"
    },
    "created_at": {
      "type": "date"
    },
    "updated_at": {
      "type": "date"
    },
    "category": {
      "type": "string"
    },
    "category_image_url": {
      "type": "string"
    }
  },
  "total_rows": 7
}
  response

  INVALID_JSON_RESPONSE = '{'
end

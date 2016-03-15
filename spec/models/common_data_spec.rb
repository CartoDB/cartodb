# coding: UTF-8
require_relative '../spec_helper'

describe CommonData do

  before(:each) do
    Typhoeus::Expectation.clear
    @common_data = CommonData.new('http://common-data.example.com/api/v1/viz?type=table&privacy=public')
    @common_data.stubs(:config).with('protocol', 'https').returns('https')
    @common_data.stubs(:config).with('username').returns('common-data')
    @common_data.stubs(:config).with('base_url').returns(nil)
    @common_data.stubs(:config).with('api_key').returns('wadus')
    @common_data.stubs(:config).with('format', 'shp').returns('shp')
    CommonDataRedisCache.new.invalidate
  end

  after(:all) do
    Typhoeus::Expectation.clear
  end

  it 'should return empty datasets response and notify error for SQL API error response' do
    stub_api_response(503)
    CartoDB.expects(:notify_error).with('common-data empty', { rows: [] , url: 'http://common-data.example.com/api/v1/viz?type=table&privacy=public'})

    @common_data.datasets.should eq []
  end

  it 'should return empty datasets and notify error for invalid json' do
    stub_api_response(200, INVALID_JSON_RESPONSE)
    CartoDB.expects(:notify_error).with('common-data empty', { rows: [] , url: 'http://common-data.example.com/api/v1/viz?type=table&privacy=public'})

    @common_data.datasets.should eq []
  end

  it 'should return correct datasets for default stub response' do
    stub_valid_api_response
    CartoDB.expects(:notify_error).times(0)

    @common_data.datasets.select{ |d| d["name"] =~ /meta_/}.length.should eq 0
    @common_data.datasets.length.should eq 6
  end

  it 'should use name if the display_name is null' do
    stub_valid_api_response
    CartoDB.expects(:notify_error).times(0)

    @common_data.datasets.first['display_name'] = @common_data.datasets.first['name']
  end

  it 'reads the attributions' do
    stub_valid_api_response
    @common_data.datasets.first['attributions'].should eq 'CartoDB Inc.'
  end

  it 'categories should be an array' do
    stub_valid_api_response
    CartoDB.expects(:notify_error).times(0)

    (@common_data.datasets.first['tags'].is_a? Array).should eq true
  end


  it 'should use SQL API V2 for export URLs' do
    stub_valid_api_response

    @common_data.datasets.first['url'].should match (/common-data\.localhost\.lan\/api\/v2/)
  end

  it 'should use SQL API V2 from user defined base url for export URLs' do
    @common_data.stubs(:config).with('base_url').returns("https://www.userdefinedurl.com")
    stub_valid_api_response

    @common_data.datasets.first['url'].should match (/^https:\/\/www\.userdefinedurl\.com\/api\/v2/)
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
    "visualizations": [
        {
            "id": "c740998c-41ea-11e5-8cda-080027880ca6",
            "name": "neighborhood_councils_losangeles",
            "display_name": null,
            "map_id": "2dcb5dde-85f1-4a9a-8e15-1ae71a1b6b8c",
            "active_layer_id": "072d55ae-4d63-4a81-a44f-6ed158b47eaa",
            "type": "table",
            "tags": [
                "Administrative regions"
            ],
            "description": "Neighborhood Councils Los Angeles",
            "privacy": "PUBLIC",
            "stats": {
                "2015-07-20": 0,
                "2015-07-21": 0,
                "2015-07-22": 0,
                "2015-07-23": 0,
                "2015-07-24": 0,
                "2015-07-25": 0,
                "2015-07-26": 0,
                "2015-07-27": 0,
                "2015-07-28": 0,
                "2015-07-29": 0,
                "2015-07-30": 0,
                "2015-07-31": 0,
                "2015-08-01": 0,
                "2015-08-02": 0,
                "2015-08-03": 0,
                "2015-08-04": 0,
                "2015-08-05": 0,
                "2015-08-06": 0,
                "2015-08-07": 0,
                "2015-08-08": 0,
                "2015-08-09": 0,
                "2015-08-10": 0,
                "2015-08-11": 0,
                "2015-08-12": 0,
                "2015-08-13": 0,
                "2015-08-14": 0,
                "2015-08-15": 0,
                "2015-08-16": 0,
                "2015-08-17": 0,
                "2015-08-18": 0
            },
            "created_at": "2015-08-13T18:40:32+00:00",
            "updated_at": "2015-08-18T08:15:13+00:00",
            "permission": {
                "id": "68ca2e6d-a7e9-4daf-aae1-908a9af31f5a",
                "owner": {
                    "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                    "username": "common-data",
                    "email": "mario.defrutos+30@cartodb.com",
                    "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                    "base_url": "http://common-data.localhost.lan:3000",
                    "quota_in_bytes": 262144000,
                    "db_size_in_bytes": 2387968
                },
                "entity": {
                    "id": "c740998c-41ea-11e5-8cda-080027880ca6",
                    "t ype": "vis"
                },
                "acl": [],
                "created_at": "2015-08-13T18:40:32+00:00",
                "updated_at": "2015-08-13T18:40:32+00:00"
            },
            "locked": false,
            "source": "[Los Angeles opendata](http://datos.losangeles.com/)",
            "title": null,
            "parent_id": null,
            "license": "apache",
            "attributions": "CartoDB Inc.",
            "kind": "geom",
            "likes": 0,
            "prev_id": null,
            "next_id": null,
            "transition_options": {
                "time": 0
            },
            "active_child": null,
            "table": {
                "id": "fa61b399-2de0-45c8-8008-cd0d527d40f3",
                "name": "public.neighborhood_counci ls_losangeles",
                "permission": {
                    "id": "68ca2e6d-a7e9-4daf-aae1-908a9af31f5a",
                    "owner": {
                        "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                        "username": "common-data",
                        "email": "mario.defrutos+30@cartodb.com",
                        "avatar_url": "//example.com/avatars /avatar_mountains_blue.png",
                        "base_url": "http://common-data.localhost.lan:3000",
                        "quota_in_bytes": 262144000,
                        "db_size_in_bytes": 2387968
                    },
                    "entity": {
                        "id": "c740998c-41ea-11e5-8cda-080027880ca6",
                        "type": "vis"
                    },
                    "acl": [],
                    "created_at": "2015-08-13T18:40:32+00:00",
                    "updated_at": "2015-08-13T18:40:32+00:00"
                },
                "geometry_types": [
                    "ST_MultiPolygon"
                ],
                "privacy": "PUBLIC",
                "updated_at": "2015-08-13T18:40:38+00:00",
                "size": 1179648,
                "row_count": 95
            },
            "external_source": {},
            "sy nchronization": null,
            "children": [],
            "liked": false
        },
        {
            "id": "b52a6246-41ea-11e5-b36d-080027880ca6",
            "name": "districts_tajikistan",
            "display_name": "Districts Tajikistan",
            "map_id": "e53c662a-a838-4f0f-a938-56d4bc36681f",
            "active_layer_i d": "f5c44bcc-af54-4d63-b916-2c06d52e0136",
            "type": "table",
            "tags": [
                "Administrative regions"
            ],
            "description": "Geometries for the districts (nohiya) in Tajikistan.",
            "privacy": "PUBLIC",
            "stats": {
                "2015-07-20": 0,
                "2015-07-21": 0,
                "2015 -07-22": 0,
                "2015-07-23": 0,
                "2015-07-24": 0,
                "2015-07-25": 0,
                "2015-07-26": 0,
                "2015-07-27": 0,
                "2015-07-28": 0,
                "2015-07-29": 0,
                "2015-07-30": 0,
                "2015-07-31": 0,
                "2015-08-01": 0,
                "2015-08-02": 0,
                "2015-08-03": 0,
                "2015-08-04": 0,
                "2015 -08-05": 0,
                "2015-08-06": 0,
                "2015-08-07": 0,
                "2015-08-08": 0,
                "2015-08-09": 0,
                "2015-08-10": 0,
                "2015-08-11": 0,
                "2015-08-12": 0,
                "2015-08-13": 0,
                "2015-08-14": 0,
                "2015-08-15": 0,
                "2015-08-16": 0,
                "2015-08-17": 0,
                "2015-08-18": 0
            },
            "cre ated_at": "2015-08-13T18:40:02+00:00",
            "updated_at": "2015-08-18T08:15:13+00:00",
            "permission": {
                "id": "16e41a99-a441-4f2d-9561-184c320d9c5a",
                "owner": {
                    "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                    "username": "common-data",
                    "email": "ma rio.defrutos+30@cartodb.com",
                    "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                    "base_url": "http://common-data.localhost.lan:3000",
                    "quota_in_bytes": 262144000,
                    "db_size_in_bytes": 2387968
                },
                "entity": {
                    "id": "b52a6246-41ea -11e5-b36d-080027880ca6",
                    "type": "vis"
                },
                "acl": [],
                "created_at": "2015-08-13T18:40:01+00:00",
                "updated_at": "2015-08-13T18:40:02+00:00"
            },
            "locked": false,
            "source": "[Tajikistan Opendata](http://datos.tajikistan.com/)",
            "title": null,
            "p arent_id": null,
            "license": "mit",
            "attributions": null,
            "kind": "geom",
            "likes": 0,
            "prev_id": null,
            "next_id": null,
            "transition_options": {
                "time": 0
            },
            "active_child": null,
            "table": {
                "id": "5f3e3dd5-fb07-4e9a-8e06-2f4238cd9e1a",
                "name": "pu blic.districts_tajikistan",
                "permission": {
                    "id": "16e41a99-a441-4f2d-9561-184c320d9c5a",
                    "owner": {
                        "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                        "username": "common-data",
                        "email": "mario.defrutos+30@cartodb.com",
                        "avatar_url": "//example .com/avatars/avatar_mountains_blue.png",
                        "base_url": "http://common-data.localhost.lan:3000",
                        "quota_in_bytes": 262144000,
                        "db_size_in_bytes": 2387968
                    },
                    "entity": {
                        "id": "b52a6246-41ea-11e5-b36d-080027880ca6",
                        "type": "vis"
                    },
                    "acl": [],
                    " created_at": "2015-08-13T18:40:01+00:00",
                    "updated_at": "2015-08-13T18:40:02+00:00"
                },
                "geometry_types": [
                    "ST_MultiPolygon"
                ],
                "privacy": "PUBLIC",
                "updated_at": "2015-08-13T18:40:09+00:00",
                "size": 262144,
                "row_count": 58
            },
            "external_sourc e": {},
            "synchronization": null,
            "children": [],
            "liked": false
        },
        {
            "id": "99f156e2-41ea-11e5-b687-080027880ca6",
            "name": "districtes_barcelona",
            "display_name": "Districtes Barcelona",
            "map_id": "05ba0e88-5ba9-4c54-8113-ca1ccafe83c9",
            "act ive_layer_id": "00533095-d121-4485-b58e-6fef5ac64ee1",
            "type": "table",
            "tags": [
                "Administrative regions"
            ],
            "description": "Geometries for each one of the districts in Barcelona.",
            "privacy": "PUBLIC",
            "stats": {
                "2015-07-20": 0,
                "2015-07- 21": 0,
                "2015-07-22": 0,
                "2015-07-23": 0,
                "2015-07-24": 0,
                "2015-07-25": 0,
                "2015-07-26": 0,
                "2015-07-27": 0,
                "2015-07-28": 0,
                "2015-07-29": 0,
                "2015-07-30": 0,
                "2015-07-31": 0,
                "2015-08-01": 0,
                "2015-08-02": 0,
                "2015-08-03": 0,
                "2015-08- 04": 0,
                "2015-08-05": 0,
                "2015-08-06": 0,
                "2015-08-07": 0,
                "2015-08-08": 0,
                "2015-08-09": 0,
                "2015-08-10": 0,
                "2015-08-11": 0,
                "2015-08-12": 0,
                "2015-08-13": 0,
                "2015-08-14": 0,
                "2015-08-15": 0,
                "2015-08-16": 0,
                "2015-08-17": 0,
                "2015-08- 18": 0
            },
            "created_at": "2015-08-13T18:39:16+00:00",
            "updated_at": "2015-08-18T08:15:13+00:00",
            "permission": {
                "id": "329e377b-526e-475e-b6b5-74cadd934164",
                "owner": {
                    "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                    "username": "common-data",
                    "email": "mario.defrutos+30@cartodb.com",
                    "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                    "base_url": "http://common-data.localhost.lan:3000",
                    "quota_in_bytes": 262144000,
                    "db_size_in_bytes": 2387968
                },
                "entity": {
                    "id": " 99f156e2-41ea-11e5-b687-080027880ca6",
                    "type": "vis"
                },
                "acl": [],
                "created_at": "2015-08-13T18:39:16+00:00",
                "updated_at": "2015-08-13T18:39:16+00:00"
            },
            "locked": false,
            "source": "[Barcelona Opendata](http://datos.barcelona.com/)",
            "titl e": null,
            "parent_id": null,
            "license": "gplv2",
            "attributions": null,
            "kind": "geom",
            "likes": 0,
            "prev_id": null,
            "next_id": null,
            "transition_options": {
                "time": 0
            },
            "active_child": null,
            "table": {
                "id": "25f3e791-2c29-4536-aeed-197465d89fa5",
                "name": "public.districtes_barcelona",
                "permission": {
                    "id": "329e377b-526e-475e-b6b5-74cadd934164",
                    "owner": {
                        "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                        "username": "common-data",
                        "email": "mario.defrutos+30@cartodb.com",
                        "avatar_url ": "//example.com/avatars/avatar_mountains_blue.png",
                        "base_url": "http://common-data.localhost.lan:3000",
                        "quota_in_bytes": 262144000,
                        "db_size_in_bytes": 2387968
                    },
                    "entity": {
                        "id": "99f156e2-41ea-11e5-b687-080027880ca6",
                        "type": "vis"
                    },
                    "acl": [],
                    "created_at": "2015-08-13T18:39:16+00:00",
                    "updated_at": "2015-08-13T18:39:16+00:00"
                },
                "geometry_types": [
                    "ST_MultiPolygon"
                ],
                "privacy": "PUBLIC",
                "updated_at": "2015-08-13T18:39:28+00:00",
                "size": 118784,
                "row_count": 10
            },
            "e xternal_source": {},
            "synchronization": null,
            "children": [],
            "liked": false
        },
        {
            "id": "81ce1d70-41ea-11e5-a6d5-080027880ca6",
            "name": "jamoat_tajikistan",
            "display_name": "Jamoat Tajikistan",
            "map_id": "e6878a94-6534-45da-9138-082b9a8e96ab ",
            "active_layer_id": "3a00ad2c-f557-4529-99b7-ef4e435816df",
            "type": "table",
            "tags": [
                "Administrative regions"
            ],
            "description": "Geometries for jamoats (village-level self-governing units) in Tajikistan.",
            "privacy": "PUBLIC",
            "stats": {
                "2015-07-20": 0,
                "2015-07-21": 0,
                "2015-07-22": 0,
                "2015-07-23": 0,
                "2015-07-24": 0,
                "2015-07-25": 0,
                "2015-07-26": 0,
                "2015-07-27": 0,
                "2015-07-28": 0,
                "2015-07-29": 0,
                "2015-07-30": 0,
                "2015-07-31": 0,
                "2015-08-01": 0,
                "2015-08-02": 0,
                "2015-08-03": 0,
                "2015-08-04": 0,
                "2015-08-05": 0,
                "2015-08-06": 0,
                "2015-08-07": 0,
                "2015-08-08": 0,
                "2015-08-09": 0,
                "2015-08-10": 0,
                "2015-08-11": 0,
                "2015-08-12": 0,
                "2015-08-13": 0,
                "2015-08-14": 0,
                "2015-08-15": 0,
                "2015-08-16": 0,
                "2015-08-17": 0,
                "2015-08-18": 0
            },
            "created_at": "2015-08-13T18:38:36+00:00",
            "updated_at": "2015-08-18T08:15:13+00:00",
            "permission": {
                "id": "d4c83c85-bd53-4f60-ad37-073750134200",
                "owner": {
                    "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                    "username": "common-data",
                    "email": "mario.defrutos+30@cartodb.com",
                    "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                    "base_url": "http://common-data.localhost.lan:3000",
                    "quota_in_bytes": 262144000,
                    "db_size_in_bytes": 2387968
                },
                "entity": {
                    "id": "81ce1d70-41ea-11e5-a6d5-080027880ca6",
                    "type": "vis"
                },
                "acl": [],
                "created_at": "2015-08-13T18:38:35+00:00",
                "updated_at": "2015-08-13T18:38:36+00:00"
            },
            "locked": false,
            "source": "[Tajikistan Opendata](http://d atos.tajikistan.com/)",
            "title": null,
            "parent_id": null,
            "license": "gplv3",
            "attributions": null,
            "kind": "geom",
            "likes": 0,
            "prev_id": null,
            "next_id": null,
            "transition_options": {
                "time": 0
            },
            "active_child": null,
            "table": {
                "id": "b5bd2c95 -6c1d-4b22-94a0-2b9c4af19e49",
                "name": "public.jamoat_tajikistan",
                "permission": {
                    "id": "d4c83c85-bd53-4f60-ad37-073750134200",
                    "owner": {
                        "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                        "username": "common-data",
                        "email": "mario.defrutos+30 @cartodb.com",
                        "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                        "base_url": "http://common-data.localhost.lan:3000",
                        "quota_in_bytes": 262144000,
                        "db_size_in_bytes": 2387968
                    },
                    "entity": {
                        "id": "81ce1d70-41ea-11e5-a6d5-0800 27880ca6",
                        "type": "vis"
                    },
                    "acl": [],
                    "created_at": "2015-08-13T18:38:35+00:00",
                    "updated_at": "2015-08-13T18:38:36+00:00"
                },
                "geometry_types": [
                    "ST_MultiPolygon"
                ],
                "privacy": "PUBLIC",
                "updated_at": "2015-08-13T18:38:47+00:00",
                "size": 380928,
                "row_count": 351
            },
            "external_source": {},
            "synchronization": null,
            "children": [],
            "liked": false
        },
        {
            "id": "6cc2d01a-41ea-11e5-9eef-080027880ca6",
            "name": "barris_barcelona",
            "display_name": "Barrios Barcelona",
            "map_id": "af479e52-7 cd6-4baf-aa38-1cb119454f73",
            "active_layer_id": "df8460d3-d3d4-44ae-85d5-9e5656e45a32",
            "type": "table",
            "tags": [
                "Administrative regions"
            ],
            "description": "Geometries for Barcelona neighborhoods.",
            "privacy": "PUBLIC",
            "stats": {
                "2015-07 -20": 0,
                "2015-07-21": 0,
                "2015-07-22": 0,
                "2015-07-23": 0,
                "2015-07-24": 0,
                "2015-07-25": 0,
                "2015-07-26": 0,
                "2015-07-27": 0,
                "2015-07-28": 0,
                "2015-07-29": 0,
                "2015-07-30": 0,
                "2015-07-31": 0,
                "2015-08-01": 0,
                "2015-08-02": 0,
                "2015-08 -03": 0,
                "2015-08-04": 0,
                "2015-08-05": 0,
                "2015-08-06": 0,
                "2015-08-07": 0,
                "2015-08-08": 0,
                "2015-08-09": 0,
                "2015-08-10": 0,
                "2015-08-11": 0,
                "2015-08-12": 0,
                "2015-08-13": 0,
                "2015-08-14": 0,
                "2015-08-15": 0,
                "2015-08-16": 0,
                "2015-08 -17": 0,
                "2015-08-18": 0
            },
            "created_at": "2015-08-13T18:38:00+00:00",
            "updated_at": "2015-08-18T08:15:13+00:00",
            "permission": {
                "id": "9bc70a85-029f-4e57-8f11-8bae254ef1cc",
                "owner": {
                    "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                    "usernam e": "common-data",
                    "email": "mario.defrutos+30@cartodb.com",
                    "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                    "base_url": "http://common-data.localhost.lan:3000",
                    "quota_in_bytes": 262144000,
                    "db_size_in_bytes": 2387968
                },
                "entity": {
                    "id": "6cc2d01a-41ea-11e5-9eef-080027880ca6",
                    "type": "vis"
                },
                "acl": [],
                "created_at": "2015-08-13T18:38:00+00:00",
                "updated_at": "2015-08-13T18:38:00+00:00"
            },
            "locked": false,
            "source": "[Barcelona Opendata](http://datos.barce lona.com/)",
            "title": null,
            "parent_id": null,
            "license": "",
            "attributions": null,
            "kind": "geom",
            "likes": 0,
            "prev_id": null,
            "next_id": null,
            "transition_options": {
                "time": 0
            },
            "active_child": null,
            "table": {
                "id": "78612fa1-1eb1-4935-a181- aedbbafe3ce7",
                "name": "public.barris_barcelona",
                "permission": {
                    "id": "9bc70a85-029f-4e57-8f11-8bae254ef1cc",
                    "owner": {
                        "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                        "username": "common-data",
                        "email": "mario.defrutos+30@cartodb.com",
                        "a vatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                        "base_url": "http://common-data.localhost.lan:3000",
                        "quota_in_bytes": 262144000,
                        "db_size_in_bytes": 2387968
                    },
                    "entity": {
                        "id": "6cc2d01a-41ea-11e5-9eef-080027880ca6",
                        "type": "vis"
                    },
                    "acl": [],
                    "created_at": "2015-08-13T18:38:00+00:00",
                    "updated_at": "2015-08-13T18:38:00+00:00"
                },
                "geometry_types": [
                    "ST_MultiPolygon"
                ],
                "privacy": "PUBLIC",
                "updated_at": "2015-08-13T18:38:14+00:00",
                "size": 397312,
                "row_count": 73
            },
            "external_source": {},
            "synchronization": null,
            "children": [],
            "liked": false
        },
        {
            "id": "d6387acc-41ea-11e5-a825-080027880ca6",
            "name": "meta_dataset",
            "display_name": null,
            "map_id": "121040fa-f4c3-4e74-8c17-3f8905d65b08",
            "active_l ayer_id": "f0fcfd45-b8e9-4753-920e-2394b4556af2",
            "type": "table",
            "tags": [],
            "description": null,
            "privacy": "PUBLIC",
            "stats": {
                "2015-07-20": 0,
                "2015-07-21": 0,
                "2015-07-22": 0,
                "2015-07-23": 0,
                "2015-07-24": 0,
                "2015-07-25": 0,
                "2015- 07-26": 0,
                "2015-07-27": 0,
                "2015-07-28": 0,
                "2015-07-29": 0,
                "2015-07-30": 0,
                "2015-07-31": 0,
                "2015-08-01": 0,
                "2015-08-02": 0,
                "2015-08-03": 0,
                "2015-08-04": 0,
                "2015-08-05": 0,
                "2015-08-06": 0,
                "2015-08-07": 0,
                "2015-08-08": 0,
                "2015- 08-09": 0,
                "2015-08-10": 0,
                "2015-08-11": 0,
                "2015-08-12": 0,
                "2015-08-13": 0,
                "2015-08-14": 0,
                "2015-08-15": 0,
                "2015-08-16": 0,
                "2015-08-17": 0,
                "2015-08-18": 0
            },
            "created_at": "2015-08-13T18:40:57+00:00",
            "updated_at": "2015-08-14T09:3 0:49+00:00",
            "permission": {
                "id": "2ac3b2f2-2b0c-45a1-8323-fe0159831a45",
                "owner": {
                    "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                    "username": "common-data",
                    "email": "mario.defrutos+30@cartodb.com",
                    "avatar_url": "//example.com/avatars/av atar_mountains_blue.png",
                    "base_url": "http://common-data.localhost.lan:3000",
                    "quota_in_bytes": 262144000,
                    "db_size_in_bytes": 2387968
                },
                "entity": {
                    "id": "d6387acc-41ea-11e5-a825-080027880ca6",
                    "type": "vis"
                },
                "acl": [],
                "created_at": "2 015-08-13T18:40:57+00:00",
                "updated_at": "2015-08-13T18:40:57+00:00"
            },
            "locked": false,
            "source": null,
            "title": null,
            "parent_id": null,
            "license": null,
            "attributions": null,
            "kind": "geom",
            "likes": 0,
            "prev_id": null,
            "next_id": null,
            "trans ition_options": {
                "time": 0
            },
            "active_child": null,
            "table": {
                "id": "d713b741-32b0-4430-a8e3-2fdb2ddda85c",
                "name": "public.meta_dataset",
                "permission": {
                    "id": "2ac3b2f2-2b0c-45a1-8323-fe0159831a45",
                    "owner": {
                        "id": "beacfd17-418e-4e71-b307 -95b5c96105dc",
                        "username": "common-data",
                        "email": "mario.defrutos+30@cartodb.com",
                        "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                        "base_url": "http://common-data.localhost.lan:3000",
                        "quota_in_bytes": 262144000,
                        "db_si ze_in_bytes": 2387968
                    },
                    "entity": {
                        "id": "d6387acc-41ea-11e5-a825-080027880ca6",
                        "type": "vis"
                    },
                    "acl": [],
                    "created_at": "2015-08-13T18:40:57+00:00",
                    "updated_at": "2015-08-13T18:40:57+00:00"
                },
                "geometry_types": [],
                "privacy": "PUBLIC",
                "updated_at": "2015-08-14T08:26:25+00:00",
                "size": 24576,
                "row_count": 5
            },
            "external_source": {},
            "synchronization": null,
            "children": [],
            "liked": false
        },
        {
           "id":"31636cc4-4fb8-11e5-98ec-0e8dde98a187",
           "name":"nycpluto_all",
           "display_name":"NYC MapPLUTO - All NY",
           "map_id":null,
           "active_layer_id":null,
           "type":"remote",
           "tags":[
              "Building footprints"
           ],
           "description":"MapPLUTO tax lot data for New York.",
           "privacy":"PUBLIC",
           "stats":{
              "2015-08-24":0,
              "2015-08-25":0,
              "2015-08-26":0,
              "2015-08-27":0,
              "2015-08-28":0,
              "2015-08-29":0,
              "2015-08-30":0,
              "2015-08-31":0,
              "2015-09-01":0,
              "2015-09-02":0,
              "2015-09-03":0,
              "2015-09-04":0,
              "2015-09-05":0,
              "2015-09-06":0,
              "2015-09-07":0,
              "2015-09-08":0,
              "2015-09-09":0,
              "2015-09-10":0,
              "2015-09-11":0,
              "2015-09-12":0,
              "2015-09-13":0,
              "2015-09-14":0,
              "2015-09-15":0,
              "2015-09-16":0,
              "2015-09-17":0,
              "2015-09-18":0,
              "2015-09-19":0,
              "2015-09-20":0,
              "2015-09-21":0,
              "2015-09-22":0
           },
           "created_at":"2015-08-31T08:13:42+00:00",
           "updated_at":"2015-08-31T08:13:42+00:00",
           "permission":{
              "id":"2f2d73c9-d60e-4eb5-8031-be7059878d4b",
              "owner":{
                    "id": "beacfd17-418e-4e71-b307 -95b5c96105dc",
                    "username": "common-data",
                    "email": "mario.defrutos+30@cartodb.com",
                    "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                    "base_url": "http://common-data.localhost.lan:3000",
                    "quota_in_bytes": 262144000,
                    "db_si ze_in_bytes": 2387968
              },
              "entity":{
                 "id":"31636cc4-4fb8-11e5-98ec-0e8dde98a187",
                 "type":"vis"
              },
              "acl":[],
              "created_at":"2015-08-31T08:13:42+00:00",
              "updated_at":"2015-08-31T08:13:42+00:00"
           },
           "locked":false,
           "source":"[NYC Planning](http://www.nyc.gov/html/dcp/home.html)",
           "title":null,
           "parent_id":null,
           "license": "public_domain",
           "attributions":null,
           "kind":"geom",
           "likes":0,
           "prev_id":null,
           "next_id":null,
           "transition_options":{
                "time": 0
           },
           "active_child":null,
           "table":{
                "id": "36612fa1-1eb1-4935-a181-5edbbafe3ce7",
                "name": "public.nycpluto_all",
                 "permission": {
                    "id": "9bc70a85-029f-4e57-8f11-8bae254ef1cc",
                    "owner": {
                        "id": "beacfd17-418e-4e71-b307-95b5c96105dc",
                        "username": "common-data",
                        "email": "mario.defrutos+30@cartodb.com",
                        "avatar_url": "//example.com/avatars/avatar_mountains_blue.png",
                        "base_url": "http://common-data.localhost.lan:3000",
                        "quota_in_bytes": 262144000,
                        "db_size_in_bytes": 2387968
                    },
                    "entity": {
                        "id": "6cc2d01a-41ea-11e5-9eef-080027880ca6",
                        "type": "vis"
                    },
                    "acl": [],
                    "created_at": "2015-08-13T18:38:00+00:00",
                    "updated_at": "2015-08-13T18:38:00+00:00"
                },
                "geometry_types": [
                    "ST_MultiPolygon"
                ],
                "privacy": "PUBLIC",
                "updated_at": "2015-08-21T18:38:14+00:00",
                "size": 397012,
                "row_count": 70
            },
           "external_source":{},
           "synchronization":null,
           "children":[],
           "liked":false
        }
    ],
    "total_entries": 6
}
  response

  INVALID_JSON_RESPONSE = '{'
end

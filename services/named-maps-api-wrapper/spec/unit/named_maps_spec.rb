# encoding: utf-8

require 'json'
require_relative '../../lib/named_maps_wrapper'

include CartoDB::NamedMapsWrapper

describe NamedMaps do

	describe '#correct_data' do
    it 'test definition data is present' do
      url = "http://cartodb.com"
      api_key = "123456"
      headers = { 'content-type' => 'application/json' }

      named_maps = NamedMaps.new(url, api_key)

      named_maps.url.should eq [ url, 'tiles', 'template' ].join('/')
      named_maps.api_key.should eq api_key
      named_maps.headers.should eq headers
      named_maps.host.should eq url

      expect {
        NamedMaps.new('', api_key)
      }.to raise_error(NamedMapsDataError)

      expect {
        NamedMaps.new(url, '')
      }.to raise_error(NamedMapsDataError)
    end
  end #correct_data

  describe '#create' do
    it 'tests the creation of a new named map' do
      url = "http://cartodb.com"
      api_key = "123456"
      name = "testing"
      headers = { 'content-type' => 'application/json' }
      template_data = { 'template_id' => '13' }
      response = ::JSON.dump(template_data)

      named_maps = NamedMaps.new(url, api_key)

      # TODO include in the stub the sent body/POST data?
      Typhoeus.stub(named_maps.url + "?api_key=" + api_key)
              .and_return(stubbed_response_200(response, headers))

      new_named_map = named_maps.create(name)

      new_named_map.should_not eq nil
      new_named_map.template.should eq template_data
    end
  end #create

  describe '#all' do
    it 'tests the retrieval of all named maps for a given api key' do
      url = "http://cartodb.com"
      api_key = "123456"
      headers = { 'content-type' => 'application/json' }
      response_data = { 'template_id' => ['1', '2'] }
      response = ::JSON.dump(response_data)

      named_maps = NamedMaps.new(url, api_key)

      Typhoeus.stub(named_maps.url + "?api_key=" + api_key)
              .and_return(stubbed_response_200(response, headers))

      all_maps = named_maps.all

      all_maps.should_not eq nil
      all_maps.should eq response_data
    end
  end #all

  describe '#get' do
    it 'tests the retrieval of a specific named map by its name' do
      pending
    end
  end #all

  def stubbed_response_200(body="", headers={})
     Typhoeus::Response.new(
        code:     200,
        body:     body,
        headers:  headers
     )
  end #stubbed_response_200

end #NamedMaps
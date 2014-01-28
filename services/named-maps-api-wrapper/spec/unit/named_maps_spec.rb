# encoding: utf-8

require 'json'
require_relative '../../lib/named_maps_wrapper'
require_relative '../spec_helper'

include CartoDB::NamedMapsWrapper
include CartoDB::NamedMapsWrapperSpecs

describe NamedMaps do

  after(:each) do
    Typhoeus::Expectation.clear
  end

  def test_user_config
    {
      name:     'test',
      api_key:  '123456'
    }
  end #test_user_config

  def test_tiler_config
    {
      protocol: 'http',
      domain:   'cartodb.com',
      port:     80,
      # Cheap trick to not rebuild constanty in tests
      fullurl:  'http://test.cartodb.com:80'
    }
  end #test_tiler_config

	describe '#correct_data' do
    it 'test definition data is present' do
      headers = { 'content-type' => 'application/json' }

      named_maps = NamedMaps.new(test_user_config, test_tiler_config)

      named_maps.url.should eq [ test_tiler_config[:fullurl], 'tiles', 'template' ].join('/')
      named_maps.api_key.should eq test_user_config[:api_key]
      named_maps.username.should eq test_user_config[:name]
      named_maps.headers.should eq headers
      named_maps.host.should eq test_tiler_config[:fullurl]

      expect {
        NamedMaps.new({}, test_tiler_config)
      }.to raise_error(NamedMapsDataError)

      expect {
        NamedMaps.new(test_user_config, {})
      }.to raise_error(NamedMapsDataError)
    end
  end #correct_data

  describe '#create' do
    it 'tests the creation of a new named map' do
      headers = { 'content-type' => 'application/json' }
      template_data = { 'template_id' => '13' }
      response = ::JSON.dump(template_data)

      named_maps = NamedMaps.new(test_user_config, test_tiler_config)

      Stubs.stubbed_response_200(named_maps.url + '?api_key=' + test_user_config[:api_key], response, headers)
      new_named_map = named_maps.create(template_data)
      new_named_map.should_not eq nil
      new_named_map.template.should eq template_data

      expect {
        named_maps.create({})
      }.to raise_error(NamedMapsDataError)
    end
  end #create

  describe '#all' do
    it 'tests the retrieval of all named maps for a given api key' do
      headers = { 'content-type' => 'application/json' }
      response_data = { 'template_id' => ['1', '2'] }
      response = ::JSON.dump(response_data)

      named_maps = NamedMaps.new(test_user_config, test_tiler_config)

      request_url = named_maps.url + '?api_key=' + test_user_config[:api_key]

      Stubs.stubbed_response_200(request_url, response, headers)
      all_maps = named_maps.all
      all_maps.should_not eq nil
      all_maps.should eq response_data

      Stubs.stubbed_response_404(request_url)
      expect {
        named_maps.all
      }.to raise_error(HTTPResponseError)
    end
  end #all

  describe '#get' do
    it 'tests the retrieval of a specific named map by its name' do
      headers = { 'content-type' => 'application/json' }
      name1 = 'test'
      name2 = 'blablabla'
      response_data = { 'template_id' => '6' }
      response = ::JSON.dump(response_data)

      named_maps = NamedMaps.new(test_user_config, test_tiler_config)

      request_url = [ named_maps.url, name1 ].join('/') + '?api_key=' + test_user_config[:api_key]

      Stubs.stubbed_response_200(request_url, response, headers)
      response_named_map = named_maps.get(name1)
      response_named_map.should_not eq nil
      response_named_map.template.should eq response_data

      expect {
        named_maps.get('')
      }.to raise_error(NamedMapsDataError)

      # template not found
      request_url = [ named_maps.url, name2 ].join('/') + '?api_key=' + test_user_config[:api_key]

      Stubs.stubbed_response_404(request_url, headers)
      response_named_map = named_maps.get(name2)
      response_named_map.should eq nil

      Stubs.stubbed_response_400(request_url, "", headers)
      expect {
        response_named_map = named_maps.get(name2)
      }.to raise_error(HTTPResponseError)
    end
  end #all

end #NamedMaps
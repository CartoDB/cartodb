# encoding: utf-8

require_relative '../../lib/named_maps_wrapper'
require_relative '../spec_helper'

include CartoDB::NamedMapsWrapper
include CartoDB::NamedMapsWrapperSpecs

describe MapInstance do

  after(:each) do
    Typhoeus::Expectation.clear
  end

  describe '#correct_data' do
    it 'test definition data is present' do
      MapInstance.new({ :layergroupid => 'test' }, 'http://cartodb.com')

      expect {
        MapInstance.new('not a hash', '')
      }.to raise_error(MapInstanceDataError)

      expect {
        MapInstance.new( { 'somefield' => 'somevalue' }, '')
      }.to raise_error(MapInstanceDataError)
    end
  end #correct_data

  describe '#tile_url_well_formed' do
    it 'test tile_url method returns well formed url' do
      z = 12
      x = 34
      y = 56
      url = 'http://cartodb.com'
      lgid = 'test'

      map_instance = MapInstance.new({ :layergroupid => lgid }, url)

      tile_url = map_instance.tile_url(z, x, y)
      tile_url.should eq 'http://cartodb.com/tiles/layergroup/test/12/34/56.png'
    end
  end #tile_url_well_formed

  describe '#tile_method' do
    it 'tests tile method returns correct output' do
      z = 12
      x = 34
      y = 56
      url = 'http://cartodb.com'
      lgid = 'test'
      expected_response_body = "loren ipsum"

      map_instance = MapInstance.new({ :layergroupid => lgid }, url)

      Stubs.stubbed_response_200(map_instance.tile_url(z, x, y), expected_response_body)
      tile_output = map_instance.tile(z, x, y)
      tile_output.should eq expected_response_body
    end
  end #tile_method

  describe '#tile_method_404_exception' do
    it 'test tile method raises exception on event of 404 http response code' do
      url = 'brokenurl'

      map_instance = MapInstance.new({ :layergroupid => "" }, url)

      Stubs.stubbed_response_404(map_instance.tile_url(1, 2, 3))

      expect {
        map_instance.tile(1, 2, 3)
      }.to raise_error(HTTPResponseError)
    end
  end #tile_method_404_exception

end #MapInstance
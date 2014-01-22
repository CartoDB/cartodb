# encoding: utf-8

require_relative '../../lib/named_maps_wrapper'

include CartoDB::NamedMapsWrapper

describe NamedMaps do

	describe '#correct_data' do
    it 'test definition data is present' do
      url = "http://kartones.cartodb.com"
      api_key = "aee7e849f2f5550598fa49637a766b873d51f45b"
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
      pending
    end
  end #get

  describe '#all' do
    it 'tests the retrieval of all named maps for a given api key' do
      pending
    end
  end #all

  describe '#get' do
    it 'tests the retrievla of a specific named map by its name' do
      pending
    end
  end #all

end #NamedMaps
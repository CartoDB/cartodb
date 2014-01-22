# encoding: utf-8

require_relative '../../lib/named_maps_wrapper'

include CartoDB::NamedMapsWrapper

describe NamedMap do

	describe '#correct_data' do
    it 'test definition data is present' do
    	template = 'templateee'
    	url = 'http://cartodb.com'
    	name = "test"

    	named_maps_mock = NamedMapsMock.new(url)
      named_map = NamedMap.new(name, template, named_maps_mock)

      named_map.template.should eq template
      named_map.url.should eq url + '/' + name

      expect {
        NamedMap.new('', template, named_maps_mock)
      }.to raise_error(NamedMapDataError)

      expect {
        NamedMap.new(name, template, '')
      }.to raise_error(NamedMapDataError)
    end
  end #correct_data

  describe '#delete' do
  	it 'tests deletion of a named map' do
    	template = 'templateee'
    	url = 'http://cartodb.com'
    	name = "test"
    	api_key = "123456789"

			named_maps_mock = NamedMapsMock.new(url, api_key)
      named_map = NamedMap.new(name, template, named_maps_mock)

			Typhoeus.stub(named_map.url + "?api_key=" + api_key)
              .and_return(stubbed_response_200())

      result = named_map.delete

      result.should eq true
    end
  end #delete

  describe '#update' do
  	it 'tests updating data of a named map' do
  		pending
  	end
  	pending
  end #update

	def stubbed_response_200(body="", headers={})
     Typhoeus::Response.new(
        code:     200,
        body:     body,
        headers:  headers
     )
  end #stubbed_response_200

end #NamedMap


class NamedMapsMock

	def initialize(url = "", api_key = "")
		@url = url
		@api_key = api_key
	end #initialize

	attr_reader	:url, :api_key

end #NamedMapsMock
# encoding: utf-8

require_relative '../../lib/named_maps_wrapper'
require_relative '../spec_helper'

include CartoDB::NamedMapsWrapper
include CartoDB::NamedMapsWrapperSpecs

describe NamedMap do
  
  after(:each) do
    Typhoeus::Expectation.clear
  end

	describe '#correct_data' do
    it 'test definition data is present' do
      pending

    	template = { 'templateee' => '1' }
    	url = 'http://cartodb.com'
    	name = 'test'

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
      pending

    	template = { 'templateee' => '1' }
    	url = 'http://cartodb.com'
    	name = 'test'
    	api_key = '123456789'

			named_maps_mock = NamedMapsMock.new(url, api_key)
      named_map = NamedMap.new(name, template, named_maps_mock)

			Stubs.stubbed_response_204(named_map.url + '?api_key=' + api_key)
      result = named_map.delete
      result.should eq true
    end
  end #delete

  describe '#update' do
  	it 'tests updating data of a named map' do
      pending

      template = { 'templateee' => '1' }
      new_template = { 'other_data' => 'aaa' }
      url = 'http://cartodb.com'
      name = 'test'
      api_key = '123456789'
  		
      named_maps_mock = NamedMapsMock.new(url, api_key)
      named_map = NamedMap.new(name, template, named_maps_mock)

      Stubs.stubbed_response_200(named_map.url + '?api_key=' + api_key)
      named_map.template.should eq template
      named_map.update(new_template)
      named_map.template.should eq new_template.merge(:version=>"0.0.1")
  	end
  end #update

  describe '#valid?' do
    it 'tests the template data validation method' do
      pending
      
      url = 'http://cartodb.com'
      name = 'test'
      api_key = '123456789'
      # Don't need to be 100% accurate as uses a validator mock
      template = { 
        'version' => '1', 
        'name' => 'name',
        'auth' => { 
          'method' => 'open' 
        },
        'placeholders' => {},
        'layergroup' => {
          'version' => '1',
          'layers' => []
        }
      }
      wrong_template = { 'something' => 'somevalue' }
      empty_template = {}

      # no validator, so cannot check and returns true
      named_maps_mock = NamedMapsMock.new(url, api_key)
      named_map = NamedMap.new(name, template, named_maps_mock)
      result, errors = named_map.valid_template?()
      result.should eq true
      errors.should eq empty_template
      result, errors = named_map.valid_template?(wrong_template)
      result.should eq true
      errors.should eq empty_template


      named_maps_mock = NamedMapsMock.new(url, api_key, ValidatorMock.new)      
      named_map = NamedMap.new(name, wrong_template, named_maps_mock)
      result, errors = named_map.valid_template?()
      result.should eq true
      errors.should eq empty_template
      result, errors = named_map.valid_template?(wrong_template)
      result.should eq true
      errors.should eq empty_template
    end
  end #valid?

end #NamedMap
# encoding: utf-8

require_relative '../../../lib/gme/table_geocoder'

RSpec.configure do |config|
  config.mock_with :mocha
end

# TODO: add it to Makefile

describe Carto::Gme::TableGeocoder do

  describe '#initialize' do
    it 'returns an object that responds to AbstractTableGeocoder interface' do
      arguments = {
        connection: nil,
        original_formatter: '{mock}',
        client_id: 'mock',
        private_key: 'mock'
      }
      table_geocoder = Carto::Gme::TableGeocoder.new(arguments)
      interface_methods = [:add_georef_status_column,
                           :cancel,
                           :run,
                           :remote_id,
                           :update_geocoding_status,
                           :process_results
                           ]
      interface_methods.each do |method|
        table_geocoder.respond_to?(method).should == true
      end
    end

    it 'raises an exception if not fed with mandatory arguments' do
      expect {
        Carto::Gme::TableGeocoder.new
      }.to raise_error(ArgumentError)

      mandatory_arguments = {
        connection: nil,
        original_formatter: '{mock}',
        client_id: 'mock',
        private_key: 'mock'
      }
      mandatory_arguments.each do |arg|
        args_missing_one = mandatory_arguments.dup
        args_missing_one.delete(arg[0])
        lambda {
          Carto::Gme::TableGeocoder.new(args_missing_one)
        }.should raise_error(KeyError)
      end
    end

    xit 'creates and keeps an instance of Gme::Client with the provided credentials' do
    end
  end

  describe '#run' do
    xit 'does something' do
    end
  end
end

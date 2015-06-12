# encoding: utf-8

require_relative '../../../lib/gme/table_geocoder'

RSpec.configure do |config|
  config.mock_with :mocha
end


describe Carto::Gme::TableGeocoder do

  mandatory_args = {
      connection: nil,
      original_formatter: '{mock}',
      client_id: 'my_client_id',
      private_key: 'my_private_key'
  }

  describe '#initialize' do

    it 'returns an object that responds to AbstractTableGeocoder interface' do
      table_geocoder = Carto::Gme::TableGeocoder.new(mandatory_args)
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

      mandatory_args.each do |arg|
        args_missing_one = mandatory_args.dup
        args_missing_one.delete(arg[0])
        lambda {
          Carto::Gme::TableGeocoder.new(args_missing_one)
        }.should raise_error(KeyError)
      end
    end

    it 'creates a client with the provided credentials' do
      gme_client_mock = mock
      Carto::Gme::Client.expects(:new).with('my_client_id', 'my_private_key').once.returns(gme_client_mock)
      Carto::Gme::GeocoderClient.expects(:new).with(gme_client_mock).once

      table_geocoder = Carto::Gme::TableGeocoder.new(mandatory_args)
    end
  end


  describe '#run' do
    pending "set's the state to 'processing' when it starts" do
      # Actually as a requirement this does not make much sense
    end

    xit "set's the state to 'completed' when it ends" do
      
    end

    xit "if there's an uncontrolled exception, sets the state to 'failed' and raises it" do
      
    end

    xit "processes 1 block at a time, keeping track of processed rows in each block" do
      
    end

  end
end

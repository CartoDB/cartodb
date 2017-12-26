# encoding: utf-8
require 'open3'
require_relative '../../../lib/gme/table_geocoder'
require_relative '../../../../../lib/url_signer'
require_relative '../../../lib/gme/exceptions'
require_relative '../../factories/pg_connection'
require_relative '../../../../../spec/spec_helper.rb'
require_relative '../../../../../spec/rspec_configuration.rb'

describe Carto::Gme::TableGeocoder do
  before(:all) do
    connection_stub = mock
    connection_stub.stubs(:run)
    @usage_metrics_stub = stub
    @log = mock
    @log.stubs(:append)
    @log.stubs(:append_and_store)
    @geocoding_model = FactoryGirl.create(:geocoding, kind: 'high-resolution', formatter: '{street}')

    @mandatory_args = {
      connection: connection_stub,
      original_formatter: '{mock}',
      client_id: 'my_client_id',
      private_key: 'my_private_key',
      usage_metrics: @usage_metrics_stub,
      log: @log,
      geocoding_model: @geocoding_model
    }
  end

  describe '#initialize' do
    it 'returns an object that responds to AbstractTableGeocoder interface' do
      table_geocoder = Carto::Gme::TableGeocoder.new(@mandatory_args)
      interface_methods = [:ensure_georef_status_colummn_valid,
                           :cancel,
                           :run,
                           :remote_id,
                           :update_geocoding_status,
                           :process_results]
      interface_methods.each do |method|
        table_geocoder.respond_to?(method, true).should == true
      end
    end

    it 'raises an exception if not fed with mandatory arguments' do
      expect { Carto::Gme::TableGeocoder.new }.to raise_error(ArgumentError)

      @mandatory_args.each do |arg|
        args_missing_one = @mandatory_args.dup
        args_missing_one.delete(arg[0])
        lambda { Carto::Gme::TableGeocoder.new(args_missing_one) }.should raise_error(KeyError)
      end
    end

    it 'creates a client with the provided credentials' do
      gme_client_mock = mock
      Carto::Gme::Client.expects(:new).with('my_client_id', 'my_private_key').once.returns(gme_client_mock)
      Carto::Gme::GeocoderClient.expects(:new).with(gme_client_mock).once
      Carto::Gme::TableGeocoder.new(@mandatory_args)
    end
  end

  describe '#run' do
    before(:each) do
      Carto::UrlSigner.any_instance.stubs(:sign_url).returns('https://maps.googleapis.com/maps/api/geocode/json')
      @table_geocoder = Carto::Gme::TableGeocoder.new(@mandatory_args)
    end

    it "set's the state to 'processing' when it starts" do
      pending 'actually as a requirement this does not make much sense'
    end

    it "set's the state to 'completed' when it ends" do
      # TODO: there's something weird that needs review here
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :total_requests, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :success_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :empty_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :failed_responses, 0)

      @table_geocoder.stubs(:ensure_georef_status_colummn_valid)
      @table_geocoder.stubs(:data_input_blocks).returns([])

      @table_geocoder.run
      @geocoding_model.state.should == 'completed'
    end

    it "if there's an uncontrolled exception, sets the state to 'failed' and raises it" do
      # TODO: there's something weird that needs review here
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :total_requests, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :success_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :empty_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :failed_responses, 0)

      @table_geocoder.stubs(:ensure_georef_status_aolummn_valid)
      @table_geocoder.stubs(:data_input_blocks).returns([{ cartodb_id: 1, searchtext: 'dummy text' }])
      @table_geocoder.stubs(:geocode).raises(StandardError, 'unexpected exception')

      expect { @table_geocoder.run }.to raise_error('unexpected exception')
      @geocoding_model.state.should == 'failed'
    end

    it "processes 1 block at a time, keeping track of processed rows in each block" do
      # TODO: there's something weird that needs review here
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :total_requests, 4)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :success_responses, 4)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :empty_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :failed_responses, 0)

      @table_geocoder.stubs(:ensure_georef_status_colummn_valid)
      mocked_input = Enumerator.new do |enum|
        # 2 blocks of 2 rows each as input
        enum.yield [{ cartodb_id: 1, searchtext: 'dummy text' }, { cartodb_id: 2, searchtext: 'dummy text' }]
        enum.yield [{ cartodb_id: 3, searchtext: 'dummy text' }, { cartodb_id: 4, searchtext: 'dummy text' }]
      end
      @table_geocoder.stubs(:data_input_blocks).returns(mocked_input)
      response = Typhoeus::Response.new(code: 200, body: read_fixture_file('gme_output_ok.json'))
      Typhoeus.stub('https://maps.googleapis.com/maps/api/geocode/json', method: :get).and_return(response)
      @table_geocoder.expects(:update_table).twice

      @table_geocoder.run
      @table_geocoder.processed_rows.should == 4
    end

    it "processes empty response" do
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :total_requests, 1)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :success_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :empty_responses, 1)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :failed_responses, 0)

      @table_geocoder.stubs(:ensure_georef_status_colummn_valid)
      mocked_input = Enumerator.new do |enum|
        enum.yield [{ cartodb_id: 1, searchtext: 'dummy text' }]
      end
      @table_geocoder.stubs(:data_input_blocks).returns(mocked_input)
      response = Typhoeus::Response.new(code: 200, body: read_fixture_file('gme_output_empty.json'))
      Typhoeus.stub('https://maps.googleapis.com/maps/api/geocode/json', method: :get).and_return(response)
      @table_geocoder.expects(:update_table).once

      @table_geocoder.run
      @table_geocoder.processed_rows.should == 1
    end

    it "processes error rows response" do
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :total_requests, 1)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :success_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :empty_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :failed_responses, 1)

      @table_geocoder.stubs(:ensure_georef_status_colummn_valid)
      mocked_input = Enumerator.new do |enum|
        enum.yield [{ cartodb_id: 1, searchtext: 'dummy text' }]
      end
      @table_geocoder.stubs(:data_input_blocks).returns(mocked_input)
      response = Typhoeus::Response.new(code: 200, body: read_fixture_file('gme_output_error.json'))
      Typhoeus.stub('https://maps.googleapis.com/maps/api/geocode/json', method: :get).and_return(response)
      @table_geocoder.expects(:update_table).once

      @table_geocoder.run
      @table_geocoder.processed_rows.should == 1
    end

    it "processes error with message response" do
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :total_requests, 1)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :success_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :empty_responses, 0)
      @usage_metrics_stub.expects(:incr).with(:geocoder_google, :failed_responses, 1)

      @table_geocoder.stubs(:ensure_georef_status_colummn_valid)
      mocked_input = Enumerator.new do |enum|
        enum.yield [{ cartodb_id: 1, searchtext: 'dummy text' }]
      end
      @table_geocoder.stubs(:data_input_blocks).returns(mocked_input)
      response = Typhoeus::Response.new(code: 200, body: read_fixture_file('gme_output_error_with_message.json'))
      Typhoeus.stub('https://maps.googleapis.com/maps/api/geocode/json', method: :get).and_return(response)
      @table_geocoder.expects(:update_table).once
      # CartoDB.expects(:notify_error).once

      @table_geocoder.run
      @table_geocoder.processed_rows.should == 1
    end
  end

  describe '#data_input_blocks' do
    before do
      conn          = CartoDB::Importer2::Factories::PGConnection.new
      @db           = conn.connection
      @pg_options   = conn.pg_options
      @table_name   = "ne_10m_populated_places_simple_#{rand.to_s[2..11]}"

      # Avoid issues on some machines if postgres system account can't read fixtures subfolder for the COPY
      filename = 'populated_places_short.csv'
      _stdout, stderr, _status = Open3.capture3("cp #{path_to(filename)} /tmp/#{filename}")
      raise if stderr != ''
      load_csv "/tmp/#{filename}"

      params = {
        connection: @db,
        table_name: @table_name,
        qualified_table_name: @table_name,
        sequel_qualified_table_name: @table_name,
        original_formatter: "{name}, {iso3}",
        client_id: 'my_client_id',
        private_key: 'my_private_key',
        max_block_size: 4,
        usage_metrics: @usage_metrics_stub,
        log: @log,
        geocoding_model: @geocoding_model
      }

      @table_geocoder = Carto::Gme::TableGeocoder.new(params)
    end

    after do
      @db.drop_table @table_name
    end

    it 'performs (floor(rows / max_block_size) + 1) queries' do
      rows = @db[@table_name.to_sym].count
      @table_geocoder.send(:ensure_georef_status_colummn_valid)

      count = 0
      @table_geocoder.send(:data_input_blocks).each do |data_block|
        data_block.each do |row|
          row.merge!(cartodb_georef_status: false)
        end
        @table_geocoder.send(:update_table, data_block)
        count += 1
      end
      count.should == (rows / @table_geocoder.max_block_size).floor + 1
    end
  end

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../../fixtures/#{filepath}")
    )
  end

  def read_fixture_file(filename)
    File.read(path_to(filename))
  end

  def load_csv(path)
    @db.run("CREATE TABLE #{@table_name} (the_geom geometry, cartodb_id integer, name text, iso3 text)")
    @db.run("COPY #{@table_name.lit}(cartodb_id, name, iso3) FROM '#{path}' DELIMITER ',' CSV")
  end
end

# encoding: utf-8

require_relative '../../../lib/gme/table_geocoder'
require_relative '../../factories/pg_connection'
require_relative '../../../../../spec/rspec_configuration.rb'

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

    before(:all) do
      gme_client_mock = mock
      Carto::Gme::Client.expects(:new).with('my_client_id', 'my_private_key').once.returns(gme_client_mock)
      Carto::Gme::GeocoderClient.expects(:new).with(gme_client_mock).once

      @table_geocoder = Carto::Gme::TableGeocoder.new(mandatory_args)
    end

    it "set's the state to 'processing' when it starts" do
      pending 'actually as a requirement this does not make much sense'
    end

    it "set's the state to 'completed' when it ends" do
      @table_geocoder.stubs(:add_georef_status_column)
      @table_geocoder.stubs(:data_input_blocks).returns([])

      @table_geocoder.run
      @table_geocoder.state.should == 'completed'
    end

    it "if there's an uncontrolled exception, sets the state to 'failed' and raises it" do
      @table_geocoder.stubs(:add_georef_status_column)
      @table_geocoder.stubs(:data_input_blocks).returns([{cartodb_id: 1, searchtext: 'dummy text'}])
      @table_geocoder.stubs(:geocode).raises(StandardError, 'unexpected exception')

      expect {
        @table_geocoder.run
      }.to raise_error('unexpected exception')
      @table_geocoder.state.should == 'failed'
    end

    it "processes 1 block at a time, keeping track of processed rows in each block" do
      @table_geocoder.stubs(:add_georef_status_column)
      mocked_input = Enumerator.new do |enum|
        # 2 blocks of 2 rows each as input
        enum.yield [{cartodb_id: 1, searchtext: 'dummy text'}, {cartodb_id: 2, searchtext: 'dummy text'}]
        enum.yield [{cartodb_id: 3, searchtext: 'dummy text'}, {cartodb_id: 4, searchtext: 'dummy text'}]
      end
      @table_geocoder.stubs(:data_input_blocks).returns(mocked_input)
      @table_geocoder.expects(:geocode).twice
      @table_geocoder.expects(:update_table).twice

      @table_geocoder.run
      @table_geocoder.processed_rows.should == 4
    end

  end


  describe '#data_input_blocks' do

    before do
      conn          = CartoDB::Importer2::Factories::PGConnection.new
      @db           = conn.connection
      @pg_options   = conn.pg_options
      @table_name   = "ne_10m_populated_places_simple"
      load_csv path_to("populated_places_short.csv")

      params = {
        connection: @db,
        table_name: @table_name,
        qualified_table_name: @table_name,
        sequel_qualified_table_name: @table_name,
        original_formatter: "{name}, {iso3}",
        client_id: 'my_client_id',
        private_key: 'my_private_key',
        max_block_size: 4
      }

      @table_geocoder = Carto::Gme::TableGeocoder.new(params)
    end

    after do
      @db.drop_table @table_name
    end

    it 'performs (floor(rows / max_block_size) + 1) queries' do
      rows = @db[@table_name.to_sym].count
      @table_geocoder.add_georef_status_column

      count = 0
      @table_geocoder.send(:data_input_blocks).each { |data_block|
        # mark them as a miss
        data_block.each { |row| row.merge!(cartodb_georef_status: false) }
        @table_geocoder.send(:update_table, data_block)
        count += 1
      }
      count.should == (rows / @table_geocoder.max_block_size).floor + 1
    end

  end


  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../../fixtures/#{filepath}")
    )
  end

  def load_csv(path)
    @db.run("CREATE TABLE #{@table_name} (the_geom geometry, cartodb_id integer, name text, iso3 text)")
    @db.run("COPY #{@table_name.lit}(cartodb_id, name, iso3) FROM '#{path}' DELIMITER ',' CSV")
  end


end

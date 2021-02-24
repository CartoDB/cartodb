require 'spec_helper'
require_relative '../factories/pg_connection'
require_relative '../../lib/abstract_table_geocoder'

describe CartoDB::AbstractTableGeocoder do

  before(:all) do
    class ConcreteTableGeocoder < CartoDB::AbstractTableGeocoder; end

    conn          = CartoDB::Importer2::Factories::PGConnection.new
    @db           = conn.connection
    @pg_options   = conn.pg_options
    @table_name   = "ne_10m_populated_places_simple"
    load_csv path_to("populated_places_short.csv")
  end

  after(:all) do
    @db.drop_table @table_name
  end


  describe '#initialize' do
    it 'sets the connection timeout to 5 hours' do
      tg = ConcreteTableGeocoder.new({
          connection: @db,
          table_name: @table_name,
          qualified_table_name: @table_name
        })
      timeout = @db.fetch("SHOW statement_timeout").first.fetch(:statement_timeout)
      timeout.should == '5h'
    end
  end


  describe '#ensure_georef_status_colummn_valid' do

    before(:each) do
      @tg = ConcreteTableGeocoder.new({
          connection: @db,
          table_name: @table_name,
          qualified_table_name: @table_name
        })
    end

    it 'adds a georef_status_column if it does not exists' do
      @tg.send(:ensure_georef_status_colummn_valid)
      assert_correctness_of_georef_status_column
    end

    it 'does nothing if the column already exists' do
      @tg.send(:ensure_georef_status_colummn_valid)
      @tg.send(:ensure_georef_status_colummn_valid)
      assert_correctness_of_georef_status_column
    end

    it 'casts its type if the column exists and is not bool' do
      @db.add_column @table_name, :georef_status_column, :text
      @tg.send(:ensure_georef_status_colummn_valid)
      assert_correctness_of_georef_status_column
    end

  end


  def assert_correctness_of_georef_status_column
    georef_status_column = @db.schema(@table_name, reload: true).select {|c| c[0] == :cartodb_georef_status}.first
    georef_status_column.nil?.should == false
    georef_status_column[1][:db_type].should == 'boolean'
  end

  def load_csv(path)
    @db.run("CREATE TABLE #{@table_name} (the_geom geometry, cartodb_id integer, name text, iso3 text)")
    @db.run("COPY #{Sequel.lit(@table_name)}(cartodb_id, name, iso3) FROM '#{path}' DELIMITER ',' CSV")
  end

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
    )
  end

end

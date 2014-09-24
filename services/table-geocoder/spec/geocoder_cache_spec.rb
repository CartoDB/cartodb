# encoding: utf-8
require 'spec_helper'
require_relative '../lib/table_geocoder.rb'
require_relative '../../geocoder/lib/geocoder.rb'
require_relative 'factories/pg_connection'

RSpec.configure do |config|
  config.mock_with :mocha
end

describe CartoDB::GeocoderCache do

  before(:all) do
    @user = create_user
  end
  after(:all) do
    @user.destroy
  end

  before do
    conn                         = CartoDB::Importer2::Factories::PGConnection.new(database: @user.database_name)
    @db                          = conn.connection
    @table_name                  = "ne_10m_populated_places_simple"
    @qualified_table_name        = "ne_10m_populated_places_simple"
    @sequel_qualified_table_name = "ne_10m_populated_places_simple"
    load_csv path_to("populated_places_short.csv")
  end

  after do
    @db.drop_table @table_name
  end

  let(:default_params) { {
    table_name: @table_name,
    qualified_table_name: @qualified_table_name,
    sequel_qualified_table_name: @sequel_qualified_table_name,
    formatter: "concat(name, iso3)",
    connection: @db,
    sql_api: { table_name: '' }
  } }

  describe '#get_cache_results' do
    it "runs the query in batches" do
      cache = CartoDB::GeocoderCache.new(default_params.merge(batch_size: 5))
      @db.run("alter table #{@table_name} add column cartodb_georef_status BOOLEAN DEFAULT NULL")
      cache.expects(:run_query).times(3).returns('')
      cache.get_cache_results
    end

    it "honors max_rows" do
      @db.run("alter table #{@table_name} add column cartodb_georef_status BOOLEAN DEFAULT NULL")
      cache = CartoDB::GeocoderCache.new(default_params.merge(
        batch_size: 5,
        max_rows: 10
      ))
      cache.expects(:run_query).times(2).returns('')
      cache.get_cache_results
    end
  end #run



  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to

  def load_csv(path)
    @db.run("CREATE TABLE #{@table_name} (the_geom geometry, cartodb_id integer, name text, iso3 text)")
    @db.run("COPY #{@table_name.lit}(cartodb_id, name, iso3) FROM '#{path}' DELIMITER ',' CSV")
  end # create_table

end # CartoDB::GeocoderCache

# encoding: utf-8
require_relative '../lib/table_geocoder.rb'
require_relative '../../geocoder/lib/geocoder.rb'
require_relative 'factories/pg_connection'
require 'ruby-debug'

RSpec.configure do |config|
  config.mock_with :mocha
end

describe CartoDB::GeocoderCache do
  before do
    conn          = CartoDB::Importer2::Factories::PGConnection.new
    @db           = conn.connection
    @pg_options   = conn.pg_options
    @table_name   = "ne_10m_populated_places_simple"
    load_sql path_to("populated_places_short.sql"), @pg_options
  end

  let(:default_params) { { table_name: @table_name, formatter: "concat(name, sov0name)", connection: @db, sql_api: { table_name: '' } } }

  describe '#get_cache_results' do
    it "runs the query in batches" do
      cache = CartoDB::GeocoderCache.new(default_params.merge(batch_size: 5))
      cache.expects(:run_query).times(8).returns('')
      cache.get_cache_results
    end

    it "honors max_rows" do
      cache = CartoDB::GeocoderCache.new(default_params.merge(
        batch_size: 5,
        max_rows: 16
      ))
      cache.expects(:run_query).times(4).returns("")
      cache.get_cache_results
    end
  end #run

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to


  def load_sql(path, pg_options)
    `psql -U #{pg_options[:user]} -f #{path} #{pg_options[:database]}`
  end # create_table

end # CartoDB::GeocoderCache

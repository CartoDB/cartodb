require 'open3'
require_relative '../lib/table_geocoder.rb'
require_relative 'factories/pg_connection'

describe CartoDB::GeocoderCache do
  before do
    conn          = CartoDB::Importer2::Factories::PGConnection.new
    @db           = conn.connection
    @pg_options   = conn.pg_options
    @table_name   = "ne_10m_populated_places_simple"
    @usage_metrics_stub = stub
    @log = mock
    @log.stubs(:append)
    @log.stubs(:append_and_store)

    # Avoid issues on some machines if postgres system account can't read fixtures subfolder for the COPY
    filename = 'populated_places_short.csv'
    stdout, stderr, status =  Open3.capture3("cp #{path_to(filename)} /tmp/#{filename}")
    raise if stderr != ''
    load_csv "/tmp/#{filename}"
  end

  after do
    @db.drop_table @table_name
  end

  let(:default_params) { {
      table_name: @table_name,
      formatter: "concat(name, iso3)",
      connection: @db, sql_api: { table_name: '' },
      qualified_table_name: @table_name,
      usage_metrics: @usage_metrics_stub,
      log: @log
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
    @db.run("COPY #{Sequel.lit(@table_name)}(cartodb_id, name, iso3) FROM '#{path}' DELIMITER ',' CSV")
  end # create_table

end # CartoDB::GeocoderCache

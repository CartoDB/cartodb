# encoding: utf-8
require 'open3'
require_relative '../../../spec/rspec_configuration.rb'
require_relative 'factories/pg_connection'
require_relative '../lib/internal_geocoder.rb'

describe CartoDB::InternalGeocoder::Geocoder do
  before do
    conn          = CartoDB::Importer2::Factories::PGConnection.new
    @db           = conn.connection
    @pg_options   = conn.pg_options
    @log = mock
    @log.stubs(:append)
  end

  let(:default_params) do
    {
      connection: @db,
      internal: {
        username: 'geocoding'
      },
      kind: 'admin0',
      geometry_type: 'polygon',
      log: @log
    }
  end

  describe '#download_results' do
    before do
      # Avoid issues on some machines if postgres system account can't read fixtures subfolder for the COPY
      filename = 'adm0.csv'
      _stdout, stderr, _status = Open3.capture3("cp #{path_to(filename)} /tmp/#{filename}")
      raise if stderr != ''
      load_csv "/tmp/#{filename}", 'adm0'
      @adm0_results_file_1 = File.open("#{path_to('adm0_geocoding_results_1.csv')}", "rb")
      @adm0_results_file_2 = File.open("#{path_to('adm0_geocoding_results_2.csv')}", "rb")
    end

    after do
      @adm0_results_file_1.close
      @adm0_results_file_2.close
      @db.drop_table 'adm0'
    end

    it "generates a csv with geocoded data" do
      CartoDB::SQLApi.any_instance.stubs(:fetch).with(adm0_response(0), 'csv').returns(@adm0_results_file_1.read)
      CartoDB::SQLApi.any_instance.stubs(:fetch).with(adm0_response(1), 'csv').returns(@adm0_results_file_2.read)
      geocoder_params = default_params.merge(qualified_table_name: 'adm0', table_schema: 'public', table_name: 'adm0',
                                             formatter: 'geo_string')
      internal_geocoder = CartoDB::InternalGeocoder::Geocoder.new(geocoder_params)
      internal_geocoder.run
      internal_geocoder.processed_rows.should eq 11
      internal_geocoder.successful_processed_rows.should eq 10
      internal_geocoder.empty_processed_rows.should eq 1
    end
  end

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end

  def load_csv(path, table_name)
    @db.run("DROP TABLE IF EXISTS #{table_name}")
    @db.run("CREATE TABLE #{table_name} (the_geom geometry, cartodb_id integer, geo_string text)")
    @db.run("COPY #{table_name.lit}(cartodb_id, geo_string) FROM '#{path}' DELIMITER ',' CSV")
  end

  def adm0_response(page)
    if page == 0
      term = "'Spain','Italy','Netherlands','Sweden','The Netherlands','France','Canada','Brazil','    Norway','Japan'"
    elsif page == 1
      term = "'Russia'"
    end

    "WITH geo_function AS (SELECT (geocode_admin0_polygons(Array[#{term}])).*) SELECT q, null AS c, null AS " \
    "a1, geom, success FROM geo_function"
  end
end

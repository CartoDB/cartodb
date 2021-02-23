require 'open3'
require_relative 'factories/pg_connection'
require_relative '../lib/internal_geocoder.rb'

describe CartoDB::InternalGeocoder::Geocoder do
  before do
    conn          = CartoDB::Importer2::Factories::PGConnection.new
    @db           = conn.connection
    @pg_options   = conn.pg_options
  end

  let(:default_params) { { connection: @db, internal: { username: 'geocoding' }, kind: 'admin0', geometry_type: 'polygon' } }

  describe '#download_results' do
    before do
      # Avoid issues on some machines if postgres system account can't read fixtures subfolder for the COPY
      filename = 'adm0.csv'
      stdout, stderr, status =  Open3.capture3("cp #{path_to(filename)} /tmp/#{filename}")
      raise if stderr != ''
      load_csv "/tmp/#{filename}", 'adm0'
    end

    after do
      @db.drop_table 'adm0'
    end

    it "generates a csv with geocoded data" do
      ig = CartoDB::InternalGeocoder.new(default_params.merge(table_name: 'adm0', formatter: 'geo_string'))
      ig.ensure_georef_status_colummn_valid
      results = ig.download_results
      `wc -l #{results} 2>&1`.to_i.should eq 11
      ig.processed_rows.should eq 11
    end
  end #run

  def path_to(filepath = '')
    File.expand_path(
      File.join(File.dirname(__FILE__), "../spec/fixtures/#{filepath}")
    )
  end #path_to

  def load_csv(path , table_name)
    @db.run("DROP TABLE IF EXISTS #{table_name}")
    @db.run("CREATE TABLE #{table_name} (the_geom geometry, cartodb_id integer, geo_string text)")
    @db.run("COPY #{Sequel.lit(table_name)}(cartodb_id, geo_string) FROM '#{path}' DELIMITER ',' CSV")
  end # create_table

end # CartoDB::GeocoderCache

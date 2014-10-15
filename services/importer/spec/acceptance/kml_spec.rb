# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'

include CartoDB::Importer2

describe 'KML regression tests' do
  before do
    pg_connection = Factories::PGConnection.new
    @db = pg_connection.connection
    @pg_options  = pg_connection.pg_options
    @db.execute('CREATE SCHEMA IF NOT EXISTS cdb_importer')
  end

  after(:each) do
    @db.execute('DROP SCHEMA cdb_importer CASCADE')
    @db.disconnect
  end

  it 'imports KML files' do
    filepath    = path_to('counties_ny_export.kml')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'imports KML files from url' do
    filepath    = "https://maps.google.com/maps/ms?hl=en&ie=UTF8&t=m" +
                  "&source=embed&authuser=0&msa=0&output=kml"         + 
                  "&msid=214357343079009794152.0004d0322cc2768ca065e"
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'imports KMZ in a 3D projection' do
    filepath    = path_to('usdm130806.kmz')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'imports multi-layer KMLs' do
    filepath    = path_to('multiple_layer.kml')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'raises if KML just contains a link to the actual KML url' do
    filepath    = path_to('abandoned.kml')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    runner.results.first.error_code.should eq 3202
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
    )
  end #path_to

  def geometry_type_for(runner)
    result      = runner.results.first
    table_name  = result.tables.first
    schema      = result.schema

    runner.db[%Q{
      SELECT public.GeometryType(the_geom)
      FROM "#{schema}"."#{table_name}"
    }].first.fetch(:geometrytype)
  end #geometry_type_for
end # KML regression tests
 

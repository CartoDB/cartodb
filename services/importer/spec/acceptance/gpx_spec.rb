# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'

include CartoDB::Importer2

describe 'SHP regression tests' do
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

  it 'imports GPX files' do
    filepath    = path_to('route2.gpx')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
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
end # SHP regression tests
 

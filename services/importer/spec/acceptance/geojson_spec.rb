# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe 'geojson regression tests' do
  before do
    @pg_options  = Factories::PGConnection.new.pg_options
  end

  it 'imports a file exported from CartoDB' do
    filepath    = path_to('tm_world_borders_simpl_0_8.geojson')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run
  end

  it 'imports a file from a url with params' do
    filepath    = 'https://raw.github.com/benbalter/dc-wifi-social/master' +
                  '/bars.geojson?foo=bar'
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run
  end

  it 'imports a file with boolean values' do
    skip
    filepath    = path_to('boolean_values.geojson')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    result      = runner.results.first
    table_name  = result.tables.first
    schema      = result.schema

    runner.db.schema(table_name, schema: 'importer')
      .find { |element| element.first == :boolean }.last
      .fetch(:type)
      .must_equal :boolean
  end

  it "raises if GeoJSON isn't valid" do
    filepath    = path_to('invalid.geojson')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    runner.results.first.error_code.must_equal 3007
  end

  def path_to(filepath)
    File.expand_path(
      File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
    )
  end #path_to

  def geometry_type_for(runner)
    result                = runner.results.first
    qualified_table_name  = result.qualified_table_name

    runner.db[%Q{
      SELECT public.GeometryType(the_geom)
      FROM #{qualified_table_name}
    }].first.fetch(:geometrytype)
  end #geometry_type_for
end # geojson regression tests


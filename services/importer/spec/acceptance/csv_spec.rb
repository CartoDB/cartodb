# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe 'csv regression tests' do
  before do
    @pg_options  = Factories::PGConnection.new.pg_options
  end

  it 'georeferences files with lat / lon columns' do
    filepath    = path_to('../../../../spec/support/data/csv_with_lat_lon.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    geometry_type_for(runner).must_equal 'POINT'
  end

  it 'imports XLS files' do
    skip
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@job, downloader)
    runner.run

    runner.exit_code.must_equal 0

    geometry_type_for(runner).wont_be_empty
  end

  it 'imports files exported from the SQL API' do
    filepath    = path_to('ne_10m_populated_places_simple.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    geometry_type_for(runner).must_equal 'POINT'
  end

  it 'imports files from Google Fusion Tables' do
    url = "https://www.google.com/fusiontables/exporttable" +
          "?query=select+*+from+1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"
    downloader  = Downloader.new(url)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    geometry_type_for(runner).must_equal 'POINT'
  end

  it 'imports files with a the_geom column in GeoJSON' do
    filepath    = path_to('csv_with_geojson.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    geometry_type_for(runner).must_equal 'MULTIPOLYGON'
  end

  it 'imports files with spaces as delimiters' do
    filepath    = path_to('fsq_places_uniq.csv')
  end

  it 'imports files with & in the name' do
    filepath    = path_to('ne_10m_populated_places_&simple.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    geometry_type_for(runner).must_equal 'POINT'
  end

  it 'imports records with in cell line breaks' do
    filepath    = path_to('in_cell_line_breaks.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader)
    runner.run

    result = runner.results.first
    runner.db[%Q{
      SELECT count(*)
      FROM #{result.schema}.#{result.table_name}
      AS count
    }].first.fetch(:count).must_equal 7
  end

  def path_to(filepath)
    File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
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

  def sample_for(job)
    job.db[%Q{
      SELECT *
      FROM #{job.qualified_table_name}
    }].first
  end #sample_for
end # csv regression tests


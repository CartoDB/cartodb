# encoding: utf-8
require_relative '../../../../spec/rspec_configuration'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'cdb_importer_context'
require_relative 'acceptance_helpers'
require_relative '../../spec/doubles/importer_stats'

include CartoDB::Importer2

describe 'csv regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"

  it 'georeferences files with lat / lon columns' do
    filepath    = path_to('../../../../spec/support/data/csv_with_lat_lon.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
    geometry_type_for(runner).should eq 'POINT'
  end

  it 'imports XLS files' do
    filepath    = path_to('../../../../spec/support/data/ngos.xlsx')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
  end

  it 'imports files with duplicated column names' do
    runner = runner_with_fixture('../fixtures/duplicated_column_name.csv')
    runner.run

    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
    table = result.tables.first
    columns = runner.db[%Q{ SELECT * FROM information_schema.columns WHERE table_schema = 'cdb_importer' AND table_name   = '#{table}' }].map { |c| c[:column_name] }
    columns.should include('column')
    columns.should include('column2')
  end

  it 'raises DuplicatedColumnError with long duplicated column names' do
    runner = runner_with_fixture('../fixtures/duplicated_long_column_name.csv')
    runner.run

    result = runner.results.first
    result.success?.should be_false
    result.error_code.should == 2005
  end

  it 'imports files exported from the SQL API' do
    filepath    = path_to('ne_10m_populated_places_simple.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    geometry_type_for(runner).should eq 'POINT'
  end

  it 'imports files from Google Fusion Tables' do
    #TODO: this spec depends on network connection
    url = "https://www.google.com/fusiontables/exporttable" +
          "?query=select+*+from+1dimNIKKwROG1yTvJ6JlMm4-B4LxMs2YbncM4p9g"
    downloader  = Downloader.new(url)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
    geometry_type_for(runner).should eq 'POINT'
  end

  it 'imports files with a the_geom column in GeoJSON' do
    filepath    = path_to('csv_with_geojson.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    geometry_type_for(runner).should eq 'MULTIPOLYGON'
  end

  it 'imports files with spaces as delimiters' do
    filepath    = path_to('fsq_places_uniq.csv')
  end

  it 'imports files with & in the name' do
    filepath    = path_to('ne_10m_populated_places_&simple.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    geometry_type_for(runner).should eq 'POINT'
  end

  it 'import files named "all"' do
    runner = runner_with_fixture('all.csv')
    runner.run

    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
  end

  it 'imports files with invalid the_geom but previous valid geometry column (see #2108)' do
    runner = runner_with_fixture('invalid_the_geom_valid_wkb_geometry.csv')
    runner.run
    
    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
  end

  it 'import big row files' do
    runner = runner_with_fixture('big_row.csv')
    runner.run
    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
  end

  it 'imports records with cell line breaks' do
    filepath    = path_to('in_cell_line_breaks.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    result = runner.results.first
    runner.db[%Q{
      SELECT count(*)
      FROM #{result.schema}.#{result.table_name}
      AS count
    }].first.fetch(:count).should eq 5
  end

  it 'refuses to import csv with broken encoding' do
    pending "Need to update clinker to match production's ruby and stdlib"
    filepath    = path_to('broken_encoding.csv')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    result = runner.results.first
    runner.results.first.error_code.should eq CartoDB::Importer2::ERRORS_MAP[EncodingDetectionError]
  end


  it 'displays a specific error message for a file with too many columns' do
    runner = runner_with_fixture('too_many_columns.csv')
    runner.run

    runner.results.first.error_code.should eq CartoDB::Importer2::ERRORS_MAP[TooManyColumnsError]
  end

  it 'displays a specific error message for a file with 10000 columns' do
    runner = runner_with_fixture('10000_columns.csv')
    runner.run

    runner.results.first.error_code.should eq CartoDB::Importer2::ERRORS_MAP[TooManyColumnsError]
  end

  def sample_for(job)
    job.db[%Q{
      SELECT *
      FROM #{job.qualified_table_name}
    }].first
  end #sample_for

  def runner_with_fixture(file)
    filepath = path_to(file)
    downloader = Downloader.new(filepath)
    Runner.new({
                 pg: @pg_options,
                 downloader: downloader,
                 log: CartoDB::Importer2::Doubles::Log.new,
                 user: CartoDB::Importer2::Doubles::User.new
               })
  end

end # csv regression tests

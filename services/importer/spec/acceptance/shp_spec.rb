# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'acceptance_helpers'
require_relative 'cdb_importer_context'
require_relative '../../../../spec/rspec_configuration.rb'
require_relative 'no_stats_context'
require_relative 'batch_sql_api_context'

include CartoDB::Importer2

describe 'SHP regression tests' do
  include AcceptanceHelpers
  include_context 'cdb_importer schema'
  include_context "no stats"
  include_context "batch_sql_api"

  it 'imports SHP files' do
    filepath    = path_to('TM_WORLD_BORDERS_SIMPL-0.3.zip')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: @log,
                               user: @user
                             })
    runner.run

    geometry_type_for(runner).should eq "MULTIPOLYGON"
    job = runner.send(:job)
    job.db.fetch(%Q{SELECT * FROM #{job.schema}.#{job.table_name}}).count
  end

  it 'imports shp files without .prj' do
    filepath    = path_to('shp_no_prj.zip')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: @log,
                               user: @user
                             })
    runner.run

    geometry_type_for(runner).should eq "MULTIPOLYGON"
    job = runner.send(:job)
    job.db.fetch(%Q{SELECT * FROM #{job.schema}.#{job.table_name}}).count
  end

end

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
require_relative 'no_stats_context'
require_relative 'batch_sql_api_context'

include CartoDB::Importer2

describe 'Mapinfo regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"
  include_context "no stats"
  include_context "batch_sql_api"

  it 'imports Mapinfo files' do
    # Rails.root not loaded yet. This is a workaround
    filepath    = "#{File.expand_path('../..', __FILE__)}/fixtures/Ivanovo.zip"
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: @log,
                               user: @user
                             })
    runner.run

    geometry_type_for(runner).should be
  end

end # Mapinfo regression tests



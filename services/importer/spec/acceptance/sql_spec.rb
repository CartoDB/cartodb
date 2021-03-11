require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative 'acceptance_helpers'
require_relative '../doubles/log'
require_relative 'cdb_importer_context'

include CartoDB::Importer2

describe 'SQL regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"

  it 'imports SQL files' do
    pending 'SQL Loader still disabled'
    filepath    = path_to('csv_with_lat_lon.sql')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: Doubles::Log.new,
                               user:Doubles::User.new
                             })
    runner.run

    result = runner.results.first
    result.success?.should be_true, "error code: #{result.error_code}, trace: #{result.log_trace}"
    geometry_type_for(runner).should be
  end

end # SQL regression tests

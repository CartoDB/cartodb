# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative 'cdb_importer_context'
require_relative 'acceptance_helpers'

include CartoDB::Importer2

describe 'GPX regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"

  it 'imports GPX files' do
    filepath    = path_to('route2.gpx')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new(@pg_options, downloader, Doubles::Log.new)
    runner.run

    geometry_type_for(runner).should be
  end

end # SHP regression tests
 

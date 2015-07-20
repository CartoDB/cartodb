# encoding: utf-8
require_relative '../../../../spec/rspec_configuration'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative 'cdb_importer_context'
require_relative 'acceptance_helpers'

describe 'GPX regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"

  it 'imports GPX files' do
    filepath    = path_to('route2.gpx')
    downloader  = CartoDB::Importer2::Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    geometry_type_for(runner).should be
  end

end

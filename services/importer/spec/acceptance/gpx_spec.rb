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

describe 'GPX regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"
  include_context "no stats"

  it 'imports GPX files' do
    filepath    = path_to('route2.gpx')
    downloader  = CartoDB::Importer2::Downloader.new(filepath)
    runner      = CartoDB::Importer2::Runner.new(pg: @pg_options,
                                                 downloader: downloader,
                                                 log: CartoDB::Importer2::Doubles::Log.new,
                                                 user: CartoDB::Importer2::Doubles::User.new)
    runner.run

    geometry_type_for(runner).should be
  end

  it 'imports a multi layer GPX file' do
    filepath    = path_to('multiple_layer.gpx')
    downloader  = CartoDB::Importer2::Downloader.new(filepath)
    runner      = CartoDB::Importer2::Runner.new(pg: @pg_options,
                                                 downloader: downloader,
                                                 log: CartoDB::Importer2::Doubles::Log.new,
                                                 user: CartoDB::Importer2::Doubles::User.new)
    runner.run

    runner.results.each { |result| result.success.should eq true }
    runner.results.length.should eq 4
  end

  it 'imports a single layer GPX file that becomes two layer dataset' do
    filepath    = path_to('one_layer.gpx')
    downloader  = CartoDB::Importer2::Downloader.new(filepath)
    runner      = CartoDB::Importer2::Runner.new(pg: @pg_options,
                                                 downloader: downloader,
                                                 log: CartoDB::Importer2::Doubles::Log.new,
                                                 user: CartoDB::Importer2::Doubles::User.new)
    runner.run

    runner.results.each { |result| result.success.should eq true }
    runner.results.length.should eq 2
  end
end

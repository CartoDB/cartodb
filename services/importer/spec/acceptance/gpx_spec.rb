require_relative '../../../../spec/rspec_configuration'
require_relative '../../../../spec/spec_helper'
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

  before(:all) do
    @user = create_user
    @user.save
  end

  after(:all) do
    @user.destroy
  end

  it 'imports GPX files' do
    filepath    = path_to('route2.gpx')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new(pg: @user.db_service.db_configuration_for,
                                                 downloader: downloader,
                                                 log: CartoDB::Importer2::Doubles::Log.new(@user),
                                                 user: @user
                                                )
    runner.run

    geometry_type_for(runner, @user).should be
  end

  it 'imports a multi layer GPX file' do
    filepath    = path_to('multiple_layer.gpx')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new(pg: @user.db_service.db_configuration_for,
                                                 downloader: downloader,
                                                 log: CartoDB::Importer2::Doubles::Log.new(@user),
                                                 user: @user
                                                )
    runner.run

    runner.results.each { |result| result.success.should eq true }
    runner.results.length.should eq 4
  end

  it 'imports a single layer GPX file that becomes two layer dataset' do
    filepath    = path_to('one_layer.gpx')
    downloader  = CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = CartoDB::Importer2::Runner.new(pg: @user.db_service.db_configuration_for,
                                                 downloader: downloader,
                                                 log: CartoDB::Importer2::Doubles::Log.new(@user),
                                                 user: @user)
    runner.run

    runner.results.each { |result| result.success.should eq true }
    runner.results.length.should eq 2
  end
end

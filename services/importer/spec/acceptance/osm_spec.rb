# encoding: utf-8
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

include CartoDB::Importer2

describe 'OSM regression tests' do
  include AcceptanceHelpers
  include_context 'cdb_importer schema'
  include_context "no stats"

  before(:all) do
    @user = create_user
    @user.save
  end

  after(:all) do
    @user.destroy
  end

  it 'imports OSM files' do
    filepath    = path_to('map2.osm')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    geometry_type_for(runner, @user).should be
  end

  it 'displays a specific error message for too many nodes requested' do
    pending 'fix test to not depend on external API call, see https://github.com/CartoDB/cartodb/issues/2677'
    filepath = 'http://api.openstreetmap.org/api/0.6/map?bbox=-73.996,40.7642,-73.8624,40.8202'
    downloader = Downloader.new(filepath)
    runner = Runner.new({
                          pg: @user.db_service.db_configuration_for,
                          downloader: downloader,
                          log: CartoDB::Importer2::Doubles::Log.new(@user),
                          user: @user
                        })
    runner.run

    result = runner.results.first
    result.error_code.should eq 1007
  end


end

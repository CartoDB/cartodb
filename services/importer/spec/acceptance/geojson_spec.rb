require_relative '../../../../spec/rspec_configuration'
require_relative '../../../../spec/spec_helper'
require 'rspec/core'
require 'rspec/expectations'
require 'rspec/mocks'

require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../../../../spec/rspec_configuration'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'acceptance_helpers'
require_relative 'no_stats_context'



describe 'geojson regression tests' do
  include AcceptanceHelpers
  include_context "no stats"

  before(:all) do
    @user = create_user
    @user.save
  end

  after(:all) do
    @user.destroy
  end

  it 'imports a file exported from CartoDB' do
    filepath    = path_to('tm_world_borders_simpl_0_8.geojson')
    downloader  = ::CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run
  end

  it 'imports a file from a url with params' do
    filepath    = 'https://raw.github.com/benbalter/dc-wifi-social/master' +
                  '/bars.geojson?foo=bar'
    downloader  = ::CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run
  end

  it "raises if GeoJSON isn't valid" do
    filepath    = path_to('invalid.geojson')
    downloader  = ::CartoDB::Importer2::Downloader.new(@user.id, filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run

    runner.results.first.error_code.should eq 1002
  end

end


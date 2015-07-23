# encoding: utf-8
require_relative '../../../../spec/rspec_configuration'
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

include CartoDB::Importer2

describe 'geojson regression tests' do
  include AcceptanceHelpers
  before do
    @pg_options  = Factories::PGConnection.new.pg_options
  end

  it 'imports a file exported from CartoDB' do
    filepath    = path_to('tm_world_borders_simpl_0_8.geojson')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run
  end

  it 'imports a file from a url with params' do
    filepath    = 'https://raw.github.com/benbalter/dc-wifi-social/master' +
                  '/bars.geojson?foo=bar'
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run
  end

  it 'imports a file with boolean values' do
    pending 'Need a boolean values geojson example'
    filepath    = path_to('boolean_values.geojson')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    result      = runner.results.first
    table_name  = result.tables.first

    @db.schema(table_name, schema: 'importer')
      .find { |element| element.first == :boolean }.last
      .fetch(:type)
      .must_equal :boolean
  end

  it "raises if GeoJSON isn't valid" do
    filepath    = path_to('invalid.geojson')
    downloader  = Downloader.new(filepath)
    runner      = Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new,
                               user: CartoDB::Importer2::Doubles::User.new
                             })
    runner.run

    runner.results.first.error_code.should eq 1002
  end

end # geojson regression tests


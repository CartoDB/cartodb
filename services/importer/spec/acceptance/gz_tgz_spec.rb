# encoding: utf-8
require_relative '../../../../spec/rspec_configuration'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../doubles/user'
require_relative 'acceptance_helpers'
require_relative 'cdb_importer_context'
require_relative '../../../../spec/rspec_configuration'
require_relative 'no_stats_context'

describe 'gz and tgz regression tests' do
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

  it 'returns ok with supported gzip file' do
    filepath    = path_to('ok_data.csv.gz')
    downloader  = ::CartoDB::Importer2::Downloader.new(filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run
    runner.results.first.success?.should eq true
  end

  it 'returns ok with supported tgz file' do
    filepath    = path_to('ok_data.tgz')
    downloader  = ::CartoDB::Importer2::Downloader.new(filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run
    runner.results.first.success?.should eq true
  end

  it 'process one of the two files inside TGZ' do
    filepath    = path_to('ok_and_wrong_data.tgz')
    downloader  = ::CartoDB::Importer2::Downloader.new(filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run
    first_import = runner.results.first.success?
    last_import = runner.results.last.success?
    (first_import or last_import).should eq true
  end

  it 'returns error if csv is invalid with supported gzip file' do
    filepath    = path_to('wrong_data.csv.gz')
    downloader  = ::CartoDB::Importer2::Downloader.new(filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @user.db_service.db_configuration_for,
                               downloader: downloader,
                               log: CartoDB::Importer2::Doubles::Log.new(@user),
                               user: @user
                             })
    runner.run
    runner.results.first.success?.should eq false
    runner.results.first.error_code.should eq 2002
  end
end

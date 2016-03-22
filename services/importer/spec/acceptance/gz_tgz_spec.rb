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
require_relative 'batch_sql_api_context'

describe 'gz and tgz regression tests' do
  include AcceptanceHelpers
  include_context "cdb_importer schema"
  include_context "no stats"
  include_context "batch_sql_api"

  before do
    @pg_options  = ::CartoDB::Importer2::Factories::PGConnection.new.pg_options
  end

  it 'returns ok with supported gzip file' do
    filepath    = path_to('ok_data.csv.gz')
    downloader  = ::CartoDB::Importer2::Downloader.new(filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: @log,
                               user: @user
                             })
    runner.run
    runner.results.first.success?.should eq true
  end

  it 'returns ok with supported tgz file' do
    filepath    = path_to('ok_data.tgz')
    downloader  = ::CartoDB::Importer2::Downloader.new(filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: @log,
                               user: @user
                             })
    runner.run
    runner.results.first.success?.should eq true
  end

  it 'process one of the two files inside TGZ' do
    filepath    = path_to('ok_and_wrong_data.tgz')
    downloader  = ::CartoDB::Importer2::Downloader.new(filepath)
    runner      = ::CartoDB::Importer2::Runner.new({
                               pg: @pg_options,
                               downloader: downloader,
                               log: @log,
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
                               pg: @pg_options,
                               downloader: downloader,
                               log: @log,
                               user: @user
                             })
    runner.run
    runner.results.first.success?.should eq false
    runner.results.first.error_code.should eq 2002
  end
end

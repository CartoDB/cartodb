# encoding: utf-8
require_relative '../../../../spec/rspec_configuration'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative 'acceptance_helpers'
require_relative 'cdb_importer_context'
require_relative 'no_stats_context'

include CartoDB::Importer2

describe 'rar regression tests' do
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

  it 'returns empty results if no supported files in the bundle' do
    filepath    = path_to('one_unsupported.rar')
    downloader  = Downloader.new(@user.id, filepath)
    runner = Runner.new(
      pg:         @user.db_service.db_configuration_for,
      downloader: downloader,
      log:        CartoDB::Importer2::Doubles::Log.new(@user),
      user:       @user
    )
    runner.run

    runner.results.length.should eq 0
  end

  it 'ignores unsupported files in the bundle' do
    filepath    = path_to('one_unsupported_one_valid.rar')
    downloader  = Downloader.new(@user.id, filepath)
    runner = Runner.new(
      pg:         @user.db_service.db_configuration_for,
      downloader: downloader,
      log:        CartoDB::Importer2::Doubles::Log.new(@user),
      user:       @user
    )
    runner.run

    runner.results.length.should eq 1
  end

  it 'imports a rar with >1 file successfully' do
    filepath    = path_to('multiple_csvs.rar')
    downloader  = Downloader.new(@user.id, filepath)
    runner = Runner.new(
      pg:         @user.db_service.db_configuration_for,
      downloader: downloader,
      log:        CartoDB::Importer2::Doubles::Log.new(@user),
      user:       @user
    )
    runner.run

    runner.results.count(&:success?).should eq 2
    runner.results.length.should eq 2
    runner.results.each do |result|
      name = @user.in_database["SELECT * FROM pg_class WHERE relname='#{result.table_name}'"].first[:relname]
      name.should eq result.table_name
    end
  end

  it 'imports a maximum of Runner::MAX_TABLES_PER_IMPORT files from a rar, but doesnt errors' do
    filepath    = path_to('more_than_10_files.rar')
    downloader  = Downloader.new(@user.id, filepath)
    runner = Runner.new(
      pg:         @user.db_service.db_configuration_for,
      downloader: downloader,
      log:        CartoDB::Importer2::Doubles::Log.new(@user),
      user:       @user
    )
    runner.run

    runner.results.count(&:success?).should eq Runner::MAX_TABLES_PER_IMPORT
    runner.results.length.should eq Runner::MAX_TABLES_PER_IMPORT
    runner.results.each do |result|
      name = @user.in_database["SELECT * FROM pg_class WHERE relname='#{result.table_name}'"].first[:relname]
      name.should eq result.table_name
    end
  end

  it 'imports a shapefile that includes a xxx.VERSION.txt file skipping it' do
    # http://www.naturalearthdata.com/downloads/
    filepath    = path_to('shapefile_with_version_txt.rar')
    downloader  = Downloader.new(@user.id, filepath)
    runner = Runner.new(
      pg:         @user.db_service.db_configuration_for,
      downloader: downloader,
      log:        CartoDB::Importer2::Doubles::Log.new(@user),
      user:       @user
    )
    runner.run

    runner.results.count(&:success?).should eq 1
    runner.results.length.should eq 1
    runner.results.each do |result|
      name = @user.in_database["SELECT * FROM pg_class WHERE relname='#{result.table_name}'"].first[:relname]
      name.should eq result.table_name
    end
  end

  it 'imports all non-failing items from a rar without failing the whole import' do
    filepath    = path_to('file_ok_and_file_ko.rar')
    downloader  = Downloader.new(@user.id, filepath)
    runner = Runner.new(
      pg:         @user.db_service.db_configuration_for,
      downloader: downloader,
      log:        CartoDB::Importer2::Doubles::Log.new(@user),
      user:       @user
    )
    runner.run

    runner.results.count(&:success?).should eq 1
    runner.results.length.should eq 2
    runner.results.select(&:success?).each do |result|
      name = @user.in_database["SELECT * FROM pg_class WHERE relname='#{result.table_name}'"].first[:relname]
      name.should eq result.table_name
    end
  end
end

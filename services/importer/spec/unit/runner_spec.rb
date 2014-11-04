# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../doubles/importer_stats'
require_relative '../doubles/loader'
require_relative '../doubles/log'
require_relative '../doubles/indexer'
require_relative '../factories/pg_connection'
require_relative '../doubles/downloader'
require_relative '../../../importer/spec/doubles/loader'

include CartoDB::Importer2

RSpec.configure do |config|
  config.mock_with :mocha
end

describe Runner do
  before(:all) do
    @filepath       = '/var/tmp/foo.txt'
    @filepath = File.open(@filepath, 'w+')
    @filepath.write('...')
    @filepath.close
    @pg_options      = Factories::PGConnection.new.pg_options

    @fake_log = CartoDB::Importer2::Doubles::Log.new
    @downloader = Downloader.new(@filepath)
    @fake_multiple_downloader_2 = CartoDB::Importer2::Doubles::MultipleDownloaderFake.instance(2)
  end

  describe '#initialize' do
    it 'requires postgres options and the path to a file' do
      expect {
        Runner.new
      }.to raise_error ArgumentError
      expect {
        Runner.new('/var/tmp/foo.txt')
      }.to raise_error ArgumentError
    end
  end

  describe '#run' do
    it 'calls import for each file to process' do
      source_file = SourceFile.new(@filepath)

      fake_loader = self.fake_loader_for(nil, source_file)
      def fake_loader.run(args); end

      runner = Runner.new(@pg_options, @downloader, @fake_log, nil, fake_loader)

      runner.stubs(:import)

      runner.expects(:import).once

      runner.run
    end

    it 'logs the file path to be imported' do
      runner      = Runner.new(@pg_options, @downloader, @fake_log, nil, fake_unpacker)

      runner.run
      (runner.report =~ /#{@filepath.path}/).should_not eq nil
    end
  end

  describe '#tracker' do
    it 'returns the block passed at initialization' do
      data_import = OpenStruct.new
      runner      = Runner.new(@pg_options, @downloader, @fake_log, fake_unpacker)

      def runner.import(*args); end

      runner.run { |state| data_import.state = 'bogus_state' }
      data_import.state.should eq 'bogus_state'
    end
  end

  describe '#import' do
    it 'creates a sucessful result if all import steps completed' do
      source_file = SourceFile.new(@filepath)
      runner      = CartoDB::Importer2::Runner.new(@pg_options, Object.new, @fake_log)
      job         = CartoDB::Importer2::Job.new({ pg_options: @pg_options, logger: @fake_log })

      def job.success_status; true; end
      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; end

      runner.import(source_file, nil, job, fake_loader)
      result = runner.results.first
      result.success?.should eq true
    end

    it 'creates a failed result if an exception raised during import' do
      fake_log = CartoDB::Importer2::Doubles::Log.new

      source_file = SourceFile.new(@filepath)
      runner      = CartoDB::Importer2::Runner.new(@pg_options, Object.new, @fake_log)
      job         = CartoDB::Importer2::Job.new({ pg_options: @pg_options, logger: @fake_log })

      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; raise 'Unleash the Kraken!!!!'; end

      runner.import(source_file, nil, job, fake_loader)
      result = runner.results.first
      result.success?.should eq false
    end

  end

  describe 'stats logger' do

    before(:each) do
      @importer_stats_spy = CartoDB::Doubles::ImporterStats.instance
    end

    it 'logs total import time' do
      runner      = Runner.new(@pg_options, @downloader, @fake_log, nil, fake_unpacker, nil, nil)
      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run').should eq 1
    end

    it 'does not fail if loader does not support logging' do
      source_file = SourceFile.new(@filepath)
      runner      = CartoDB::Importer2::Runner.new(@pg_options, Object.new, @fake_log)
      spy_runner_importer_stats(runner, @importer_stats_spy)
      job         = CartoDB::Importer2::Job.new({ pg_options: @pg_options, logger: @fake_log })

      fake_loader = CartoDB::Importer2::Doubles::Loader.new
      runner.import(source_file, nil, job, fake_loader)
      runner.results.first.success?.should == true
    end

    it 'logs single resource import flow time' do
      runner      = Runner.new(@pg_options, @downloader, @fake_log, nil, fake_unpacker, nil, nil)
      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run.resource').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.download').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.quota_check').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.unpack').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.import').should eq 1
      @importer_stats_spy.timed_block_suffix_count('run.resource.cleanup').should eq 1
    end

    it 'logs multiple subresource import times' do
      runner = Runner.new(@pg_options, @fake_multiple_downloader_2, @fake_log, nil, nil, nil, nil)
      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run.subresource').should eq 2
    end

    it 'logs multiple subresource import flow times' do
      runner = Runner.new(@pg_options, @fake_multiple_downloader_2, @fake_log, nil, nil, nil, nil)
      spy_runner_importer_stats(runner, @importer_stats_spy)
      runner.run
      @importer_stats_spy.timed_block_suffix_count('run.subresource.datasource_metadata').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.download').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.quota_check').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.import').should eq 2
      @importer_stats_spy.timed_block_suffix_count('run.subresource.cleanup').should eq 2
    end
  end

  def spy_runner_importer_stats(runner, importer_stats_spy)
    runner.instance_eval {
      @importer_stats = importer_stats_spy
    }
  end

  def fake_loader_for(job, source_file)
    OpenStruct.new(
      job:                job,
      source_file:        source_file,
      source_files:       [source_file],
      valid_table_names:  []
    )
  end

  def fake_unpacker()
    Class.new {
      def initialize
        @sourcefile = SourceFile.new('/var/tmp/foo.txt')
      end
      def run(*args)
      end

      def source_files
        [@sourcefile]
      end

      def clean_up
      end
    }.new
  end

end


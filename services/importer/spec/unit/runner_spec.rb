# encoding: utf-8
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../doubles/loader'
require_relative '../doubles/log'
require_relative '../doubles/indexer'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

RSpec.configure do |config|
  config.mock_with :mocha
end

describe Runner do
  before do

    @filepath       = '/var/tmp/foo.txt'
    FileUtils.touch(@filepath)
    @pg_options      = Factories::PGConnection.new.pg_options
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
      fake_log = Doubles::Log.new

      downloader  = Downloader.new(@filepath)
      source_file = SourceFile.new(@filepath)

      fake_loader = self.fake_loader_for(nil, source_file)
      def fake_loader.run(args); end

      runner = Runner.new(@pg_options, downloader, fake_log, nil, fake_loader)

      runner.stubs(:import)

      runner.expects(:import).once

      runner.run
    end

    it 'logs the file path to be imported' do
      fake_log = Doubles::Log.new

      downloader  = Downloader.new(@filepath)
      runner      = Runner.new(@pg_options, downloader, fake_log, nil, fake_unpacker)

      runner.run
      (runner.report =~ /#{@filepath}/).should_not be nil
    end
  end

  describe '#tracker' do
    it 'returns the block passed at initialization' do
      fake_log = Doubles::Log.new

      data_import = OpenStruct.new
      downloader  = Downloader.new(@filepath)
      runner      = Runner.new(@pg_options, downloader, fake_log, fake_unpacker)

      def runner.import(*args); end

      runner.run { |state| data_import.state = 'bogus_state' }
      data_import.state.should eq 'bogus_state'
    end
  end

  describe '#import' do
    it 'creates a sucessful result if all import steps completed' do
      fake_log = Doubles::Log.new

      source_file = SourceFile.new(@filepath)
      runner      = Runner.new(@pg_options, Object.new, fake_log)
      job         = Job.new({ pg_options: @pg_options, logger: fake_log })

      def job.success_status; true; end
      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; end

      runner.import(source_file, job, fake_loader)
      result = runner.results.first
      result.success?.should eq true
    end

    it 'creates a failed result if an exception raised during import' do
      fake_log = Doubles::Log.new

      source_file = SourceFile.new(@filepath)
      runner      = Runner.new(@pg_options, Object.new, fake_log)
      job         = Job.new({ pg_options: @pg_options, logger: fake_log })

      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; raise 'Unleash the Kraken!!!!'; end

      runner.import(source_file, job, fake_loader)
      result = runner.results.first
      result.success?.should eq false
    end
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
      def run(*args)
      end

      def source_files
        [@filepath]
      end

      def clean_up
      end
    }.new
  end
end


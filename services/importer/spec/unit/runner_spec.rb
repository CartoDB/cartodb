# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'minitest/mock'
require 'sqlite3'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../doubles/loader'
require_relative '../doubles/indexer'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe Runner do
  before do
    @filepath       = '/var/tmp/foo.txt'
    @pg_options      = Factories::PGConnection.new.pg_options
  end

  describe '#initialize' do
    it 'requires postgres options and the path to a file' do
      lambda { Runner.new }.must_raise ArgumentError
      lambda { Runner.new '/var/tmp/foo.txt' }.must_raise ArgumentError
    end
  end #initialize

  describe '#run' do
    it 'calls import for each file to process' do
      downloader  = Downloader.new(@filepath)
      runner      = Runner.new(@pg_options, downloader)
      runner.instance_variable_set(:@import_called, 0)

      def runner.import(*args)
        @import_called = @import_called +1
      end

      runner.run

      runner.instance_variable_get(:@import_called).must_equal 1
    end

    it 'logs the file path to be imported' do
      downloader  = Downloader.new(@filepath)
      runner      = Runner.new(@pg_options, downloader)
      runner.instance_variable_set(:@import_called, 0)

      def runner.import(*args)
        @import_called = @import_called +1
      end

      runner.run
      runner.report.must_match /#{@filepath}/
    end
  end #run

  describe '#import' do
    it 'creates a sucessful result if all import steps completed' do
      source_file = SourceFile.new(@filepath)
      runner      = Runner.new(@pg_options, Object.new)
      job         = Job.new(
                      logger:     runner.log,
                      pg_options: @pg_options
                    )

      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; end

      runner.import(source_file, job, fake_loader)
      result = runner.results.first
      result.fetch(:success).must_equal true
    end

    it 'creates a failed result if an exception raised during import' do
      source_file = SourceFile.new(@filepath)
      runner      = Runner.new(@pg_options, Object.new)
      job         = Job.new(
                      logger:     runner.log,
                      pg_options: @pg_options
                    )

      fake_loader = self.fake_loader_for(job, source_file)
      def fake_loader.run; raise 'Unleash the Kraken!!!!'; end

      runner.import(source_file, job, fake_loader)
      result = runner.results.first
      result.fetch(:success).must_equal false
    end
  end

  def fake_loader_for(job, source_file)
    OpenStruct.new(
      job:                job, 
      source_file:        source_file,
      valid_table_names:  []
    )
  end #fake_loader
end # Runner


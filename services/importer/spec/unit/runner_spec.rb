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
end # Runner


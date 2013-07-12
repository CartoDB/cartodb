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
    pg_options      = Factories::PGConnection.new.pg_options
    @job            = Job.new(pg_options: pg_options)
    @georeferencer  = Object.new
    @indexer        = Doubles::Indexer.new
  end

  describe '#initialize' do
    it 'requires postgres options and the path to a file' do
      lambda { Runner.new }.must_raise ArgumentError
      lambda { Runner.new '/var/tmp/foo.txt' }.must_raise ArgumentError
    end
  end #initialize

  describe '#run' do
    it 'loads the data through the loader' do
      downloader  = Downloader.new(@filepath, @job.id)
      runner      = Runner.new(@job, downloader, @georeferencer, @indexer)
      loader      = Minitest::Mock.new
      exit_code   = rand(999)

      runner.send :instance_variable_set, :@loader, loader
      loader.expect :run, Object.new
      loader.expect :exit_code, exit_code
      runner.run
      loader.verify
    end

    it 'logs the file path to be imported' do
      downloader  = Downloader.new(@filepath, @job.id)
      runner      = Runner.new(@job, downloader, @georeferencer, @indexer)
      runner.run
      runner.report.must_match /#{@filepath}/
    end

    it 'logs the exit code of the loader' do
      downloader  = Downloader.new(@filepath, @job.id)
      runner      = Runner.new(@job, downloader, @georeferencer, @indexer)
      runner.run
      runner.report.must_match /exit code/
    end
  end #run

  describe '#exit_code' do
    it 'returns the exit code from the loader' do
      downloader  = Downloader.new(@filepath, @job.id)
      runner      = Runner.new(@job, downloader, @georeferencer, @indexer)
      loader      = Minitest::Mock.new
      exit_code   = rand(999)

      runner.send :instance_variable_set, :@loader, loader
      loader.expect :exit_code, exit_code
      runner.exit_code.must_equal exit_code
      loader.verify
    end
  end #exit_code
end # Runner


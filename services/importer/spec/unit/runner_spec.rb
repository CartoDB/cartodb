# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'minitest/mock'
require 'sqlite3'
require_relative '../../lib/importer/runner'
require_relative '../../lib/importer/job'
require_relative '../../lib/importer/downloader'
require_relative '../doubles/loader'
require_relative '../factories/pg_connection'

include CartoDB

describe Importer2::Runner do
  before do
    @filepath     = '/var/tmp/foo.txt'
    pg_options    = Importer2::Factories::PGConnection.new.pg_options
    @job          = Importer2::Job.new(pg_options: pg_options)
  end

  describe '#initialize' do
    it 'requires postgres options and the path to a file' do
      lambda { Importer2::Runner.new }.must_raise ArgumentError
      lambda { Importer2::Runner.new '/var/tmp/foo.txt' }.must_raise ArgumentError
    end
  end #initialize

  describe '#run' do
    it 'loads the data through the loader' do
      downloader  = Importer2::Downloader.new(@filepath, @job.id)
      runner      = Importer2::Runner.new(@job, downloader)
      loader      = Minitest::Mock.new
      exit_code   = rand(999)

      runner.send :instance_variable_set, :@loader, loader
      loader.expect :run, Object.new
      loader.expect :exit_code, exit_code
      runner.run
      loader.verify
    end

    it 'logs the file path to be imported' do
      downloader  = Importer2::Downloader.new(@filepath, @job.id)
      runner      = Importer2::Runner.new(@job, downloader)
      runner.run
      runner.report.must_match /#{@filepath}/
    end

    it 'logs the exit code of the loader' do
      downloader  = Importer2::Downloader.new(@filepath, @job.id)
      runner      = Importer2::Runner.new(@job, downloader)
      runner.run
      runner.report.must_match /exit code/
    end
  end #run

  describe '#exit_code' do
    it 'returns the exit code from the loader' do
      downloader  = Importer2::Downloader.new(@filepath, @job.id)
      runner      = Importer2::Runner.new(@job, downloader)
      loader      = Minitest::Mock.new
      exit_code   = rand(999)

      runner.send :instance_variable_set, :@loader, loader
      loader.expect :exit_code, exit_code
      runner.exit_code.must_equal exit_code
      loader.verify
    end
  end #exit_code
end # Importer2::Runner


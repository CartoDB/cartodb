# encoding: utf-8
require 'minitest/autorun'
require 'sqlite3'
require_relative '../../runner'
require_relative '../doubles/loader'

include CartoDB

describe Importer::Runner do
  before do
    @exit_code    = rand(999)
    @filepath     = '/var/tmp/foo.txt'
    @pg_options   = {}
    @loader       = Importer::Doubles::Loader.new
  end

  describe '#initialize' do
    it 'requires postgres options and the path to a file' do
      lambda { Importer::Runner.new }.must_raise ArgumentError
      lambda { Importer::Runner.new '/var/tmp/foo.txt' }.must_raise ArgumentError
    end

    it 'assigns an id' do
      job = Importer::Runner.new(@pg_options, '/var/tmp/foo.txt')
      job.id.wont_be_nil
    end
  end #initialize

  describe '#run' do
    it 'loads the data through the loader' do
      loader    = Minitest::Mock.new
      importer  = Importer::Runner.new(@pg_options, @filepath, loader)

      loader.expect(:run, Object.new, [@filepath])
      loader.expect(:exit_code, @exit_code)
      importer.run
      loader.verify
    end

    it 'logs the file path to be imported' do
      importer  = Importer::Runner.new(@pg_options, @filepath, @loader)
      importer.run
      importer.job.logger.to_s.must_match /#{@filepath}/
    end

    it 'logs the exit code of the loader' do
      importer  = Importer::Runner.new(@pg_options, @filepath, @loader)
      importer.run
      importer.job.logger.to_s.must_match /exit code/
    end
  end #run

  describe '#exit_code' do
    it 'returns the exit code from the loader' do
      loader    = Minitest::Mock.new
      importer  = Importer::Runner.new(@pg_options, @filepath, loader)
      loader.expect :exit_code, @exit_code
      importer.exit_code.must_equal @exit_code
      loader.verify
    end
  end #exit_code
end # Importer::Runner


# encoding: utf-8
require 'minitest/autorun'
require 'sqlite3'
require_relative '../../runner'

include CartoDB

describe Importer::Runner do
  before do
    @exit_code    = rand(999)
    @filepath     = '/var/tmp/foo.txt'
    @loader       = Minitest::Mock.new
    @loader.expect(:run, @exit_code, [@filepath])
    @connection   = connection_factory
  end

  describe '#initialize' do
    it 'requires a db connection and the path to a file' do
      lambda { Importer::Runner.new }.must_raise ArgumentError
      lambda { Importer::Runner.new '/var/tmp/foo.txt' }.must_raise ArgumentError
    end

    it 'assigns an id' do
      job = Importer::Runner.new(connection_factory, '/var/tmp/foo.txt')
      job.id.wont_be_nil
    end
  end #initialize

  describe '#run' do
    it 'loads the data through the loader' do
      importer    = Importer::Runner.new(@connection, @filepath, @loader)

      importer.run
      @loader.verify
    end

    it 'returns the exit code from the loader' do
      importer    = Importer::Runner.new(@connection, @filepath, @loader)

      @loader.expect(:run, @exit_code, [@filepath])
      importer.run.must_equal @exit_code
    end

    it 'logs the file path to be imported' do
      importer    = Importer::Runner.new(@connection, @filepath, @loader)
      importer.run
      importer.job.logger.to_s.must_match /#{@filepath}/
    end

    it 'logs the exit code of the loader' do
      importer    = Importer::Runner.new(@connection, @filepath, @loader)

      importer.run
      importer.job.logger.to_s.must_match /#{@exit_code}/
    end
  end #run

  def job_factory
    job = OpenStruct.new(
      connection: SQLite3::Database.new(":memory:"),
      filepath:   '/var/tmp/foo.txt',
      job_id:     rand(999),
      logger:     TrackRecord::Log.new
    )

    def job.log(*args)
      logger.append(*args);
    end #log
    job
  end #job_factory

  def connection_factory
    SQLite3::Database.new ":memory:"
  end #connection_factory
end # Importer::Runner


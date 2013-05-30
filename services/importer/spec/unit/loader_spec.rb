# encoding: utf-8
require 'minitest/autorun'
require 'sqlite3'
require_relative '../../loader'

include CartoDB

describe Importer::Loader do
  describe '#run' do
    before do
      @ogr2ogr = Minitest::Mock.new
      @ogr2ogr.expect(:run, Object.new, [])
      @ogr2ogr.expect(:exit_code, 0, [])
      @ogr2ogr.expect(:command_output, '', [])
    end

    it 'logs the database connection used' do
      job         = job_factory
      loader      = Importer::Loader.new(job, @ogr2ogr)
      loader.run
      job.logger.to_s.must_match /#{job.connection}/
    end

    it 'runs the ogr2ogr command to load the file' do
      loader  = Importer::Loader.new(job_factory, @ogr2ogr)

      loader.run
      @ogr2ogr.verify
    end

    it 'logs the exit code from ogr2ogr' do
      job     = job_factory
      loader  = Importer::Loader.new(job, @ogr2ogr)

      loader.run
      job.logger.to_s.must_match /ogr2ogr exit code: \d+/
    end

    it 'logs any output from ogr2ogr' do
      job     = job_factory
      loader  = Importer::Loader.new(job, @ogr2ogr)

      loader.run
      job.logger.to_s.must_match /ogr2ogr output: \w*/
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
end # Importer::Loader


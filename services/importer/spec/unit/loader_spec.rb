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

  describe '#ogr2ogr' do
    it 'returns the passed ogr2ogr instance' do
      job     = job_factory
      ogr2ogr = Object.new
      loader  = Importer::Loader.new(job, ogr2ogr)

      loader.ogr2ogr.must_equal ogr2ogr
    end

    it 'initializes an ogr2ogr command wrapper if none passed' do
      job     = Minitest::Mock.new
      loader  = Importer::Loader.new(job)

      job.expect :filepath, {}
      job.expect :pg_options, {}
      job.expect :log, {}
      job.expect :id, {}
      loader.ogr2ogr.must_be_instance_of Importer::Ogr2ogr
    end
  end  #ogr2ogr

  def job_factory
    job = OpenStruct.new(
      id:         rand(999),
      filepath:   '/var/tmp/foo.txt',
      pg_options: {},
      logger:     TrackRecord::Log.new
    )

    def job.log(*args)
      logger.append(*args);
    end #log
    job
  end #job_factory
end # Importer::Loader


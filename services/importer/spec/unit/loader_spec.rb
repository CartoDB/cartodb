# encoding: utf-8
require 'minitest/autorun'
require 'sqlite3'
require_relative '../../loader'
require_relative '../doubles/job'

include CartoDB

describe Importer::Loader do
  before do
    @job      = Importer::Doubles::Job.new
    @ogr2ogr  = Minitest::Mock.new
    @ogr2ogr.expect(:run, Object.new, [])
    @ogr2ogr.expect(:exit_code, 0, [])
    @ogr2ogr.expect(:command_output, '', [])
  end

  describe '#run' do
    it 'logs the database connection options used' do
      loader      = Importer::Loader.new(@job, @ogr2ogr)
      loader.run
      @job.logger.to_s.must_match /#{@job.pg_options.keys.first}/
    end

    it 'runs the ogr2ogr command to load the file' do
      loader  = Importer::Loader.new(@job, @ogr2ogr)

      loader.run
      @ogr2ogr.verify
    end

    it 'logs the exit code from ogr2ogr' do
      loader  = Importer::Loader.new(@job, @ogr2ogr)
      loader.run
      @job.logger.to_s.must_match /ogr2ogr exit code: \d+/
    end

    it 'logs any output from ogr2ogr' do
      loader  = Importer::Loader.new(@job, @ogr2ogr)

      loader.run
      @job.logger.to_s.must_match /ogr2ogr output: \w*/
    end
  end #run

  describe '#ogr2ogr' do
    it 'returns the passed ogr2ogr instance' do
      ogr2ogr = Object.new
      loader  = Importer::Loader.new(@job, ogr2ogr)

      loader.ogr2ogr.must_equal ogr2ogr
    end

    it 'initializes an ogr2ogr command wrapper if none passed' do
      loader  = Importer::Loader.new(@job)
      loader.ogr2ogr.must_be_instance_of Importer::Ogr2ogr
    end
  end  #ogr2ogr
end # Importer::Loader


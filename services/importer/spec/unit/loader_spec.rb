# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'sqlite3'

require_relative '../../lib/importer/loader'
require_relative '../../lib/importer/source_file'
require_relative '../doubles/job'
require_relative '../doubles/ogr2ogr'

include CartoDB

describe Importer2::Loader do
  before do
    @job          = Importer2::Doubles::Job.new
    @source_file  = Importer2::SourceFile.new('/var/tmp/foo')
    @ogr2ogr      = Importer2::Doubles::Ogr2ogr.new
  end

  describe '#run' do
    it 'logs the database connection options used' do
      loader      = Importer2::Loader.new(@job, @source_file, @ogr2ogr)
      loader.run
      @job.logger.to_s.must_match /#{@job.pg_options.keys.first}/
    end

    it 'runs the ogr2ogr command to load the file' do
      ogr2ogr = MiniTest::Mock.new
      loader  = Importer2::Loader.new(@job, @source_file, ogr2ogr)

      def ogr2ogr.commnad_output; end
      ogr2ogr.expect :run, Object.new
      ogr2ogr.expect :command_output, ''
      ogr2ogr.expect :exit_code, 0
      loader.run
      ogr2ogr.verify
    end

    it 'logs the exit code from ogr2ogr' do
      loader  = Importer2::Loader.new(@job, @source_file, @ogr2ogr)
      loader.run
      @job.logger.to_s.must_match /ogr2ogr exit code: \d+/
    end

    it 'logs any output from ogr2ogr' do
      loader  = Importer2::Loader.new(@job, @source_file, @ogr2ogr)

      loader.run
      @job.logger.to_s.must_match /ogr2ogr output: \w*/
    end
  end #run

  describe '#ogr2ogr' do
    it 'returns the passed ogr2ogr instance' do
      ogr2ogr = Object.new
      loader  = Importer2::Loader.new(@job, @source_file, ogr2ogr)

      loader.ogr2ogr.must_equal ogr2ogr
    end

    it 'initializes an ogr2ogr command wrapper if none passed' do
      loader  = Importer2::Loader.new(@job, @source_file)
      loader.ogr2ogr.must_be_instance_of Importer2::Ogr2ogr
    end
  end  #ogr2ogr
end # Importer2::Loader


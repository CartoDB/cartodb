# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'sqlite3'

require_relative '../../lib/importer/loader'
require_relative '../../lib/importer/source_file'
require_relative '../doubles/job'
require_relative '../doubles/ogr2ogr'
require_relative '../doubles/georeferencer'

include CartoDB::Importer2

describe Loader do
  before do
    @job            = Doubles::Job.new
    @source_file    = SourceFile.new('/var/tmp/foo')
    @ogr2ogr        = Doubles::Ogr2ogr.new
    @georeferencer  = Doubles::Georeferencer.new

    @loader         = Loader.new(@job, @source_file, @ogr2ogr, @georeferencer)
  end

  describe '#run' do
    it 'logs the database connection options used' do
      @loader.run
      @job.logger.to_s.must_match /#{@job.pg_options.keys.first}/
    end

    it 'runs the ogr2ogr command to load the file' do
      ogr2ogr   = MiniTest::Mock.new
      loader   = Loader.new(@job, @source_file, ogr2ogr, @georeferencer)

      def ogr2ogr.commnad_output; end
      ogr2ogr.expect :command_output, ''
      ogr2ogr.expect :exit_code, 0
      ogr2ogr.expect :run, Object.new
      loader.run
      ogr2ogr.verify
    end

    it 'logs the exit code from ogr2ogr' do
      @loader.run
      @job.logger.to_s.must_match /ogr2ogr exit code: \d+/
    end

    it 'logs any output from ogr2ogr' do
      @loader.run
      @job.logger.to_s.must_match /ogr2ogr output: \w*/
    end
  end #run

  describe '#ogr2ogr' do
    it 'returns the passed ogr2ogr instance' do
      ogr2ogr = Object.new
      loader  = Loader.new(@job, @source_file, ogr2ogr, @georeferencer)

      loader.ogr2ogr.must_equal ogr2ogr
    end

    it 'initializes an ogr2ogr command wrapper if none passed' do
      loader  = Loader.new(@job, @source_file)
      loader.ogr2ogr.must_be_instance_of Ogr2ogr
    end
  end  #ogr2ogr
end # Loader


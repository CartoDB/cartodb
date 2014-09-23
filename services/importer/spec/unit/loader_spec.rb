# encoding: utf-8
require_relative '../../lib/importer/loader'
require_relative '../../lib/importer/source_file'
require_relative '../doubles/job'
require_relative '../doubles/ogr2ogr'
require_relative '../doubles/georeferencer'

include CartoDB::Importer2

RSpec.configure do |config|
  config.mock_with :mocha
end

describe Loader do
  before do
    @job            = Doubles::Job.new
    @source_file    = SourceFile.new('/var/tmp/foo')
    @ogr2ogr        = Doubles::Ogr2ogr.new
    @georeferencer  = Doubles::Georeferencer.new

    @loader         = Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
  end

  describe '#run' do

    it 'logs the database connection options used' do
      @loader.run
      (@job.logger.to_s. =~ /#{@job.pg_options.keys.first}/).should_not be nil
    end

    it 'runs the ogr2ogr command to load the file' do
      ogr2ogr_mock = mock
      ogr2ogr_mock.stubs(:command).returns('')
      ogr2ogr_mock.stubs(:command_output).returns('')
      ogr2ogr_mock.stubs(:exit_code).returns(0)
      ogr2ogr_mock.stubs(:run).returns(Object.new)

      loader   = Loader.new(@job, @source_file, layer=nil, ogr2ogr_mock, @georeferencer)


      loader.run
    end

    it 'logs the exit code from ogr2ogr' do
      @loader.run
      (@job.logger.to_s =~ /ogr2ogr exit code: \d+/).should_not be nil
    end

    it 'logs any output from ogr2ogr' do
      @loader.run
      (@job.logger.to_s =~ /ogr2ogr output: \w*/).should_not be nil
    end
  end

  describe '#ogr2ogr' do

    it 'returns the passed ogr2ogr instance' do
      ogr2ogr = Object.new
      loader  = Loader.new(@job, @source_file, layer=nil, ogr2ogr, @georeferencer)

      loader.ogr2ogr.should eq ogr2ogr
    end

    it 'initializes an ogr2ogr command wrapper if none passed' do
      loader  = Loader.new(@job, @source_file)
      loader.ogr2ogr.class.name.should eq 'CartoDB::Importer2::Ogr2ogr'
    end
  end
end


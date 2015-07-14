# encoding: utf-8
require 'ostruct'
require_relative '../../lib/importer/loader'
require_relative '../../lib/importer/source_file'
require_relative '../doubles/job'
require_relative '../doubles/ogr2ogr'
require_relative '../doubles/georeferencer'
require_relative '../../spec/doubles/importer_stats'
require_relative '../../../../spec/rspec_configuration.rb'

describe CartoDB::Importer2::Loader do
  before do
    resultset = OpenStruct.new(:first => {:count => 10})
    db = Object.new
    db.stubs(:fetch).returns(resultset)
    @job            = CartoDB::Importer2::Doubles::Job.new(db)
    @source_file    = CartoDB::Importer2::SourceFile.new('/var/tmp/foo')
    @ogr2ogr        = CartoDB::Importer2::Doubles::Ogr2ogr.new
    @georeferencer  = CartoDB::Importer2::Doubles::Georeferencer.new
    @loader         = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
  end

  describe '#run' do

    it 'logs the database connection options used' do
      @loader.run
      (@job.logger.to_s. =~ /#{@job.pg_options.keys.first}/).should_not be nil
    end

    it 'runs the ogr2ogr command to load the file' do
      ogr2ogr_mock = mock
      ogr2ogr_mock.stubs(:command).returns('').at_least_once
      ogr2ogr_mock.stubs(:command_output).returns('').at_least_once
      ogr2ogr_mock.stubs(:exit_code).returns(0).at_least_once
      ogr2ogr_mock.stubs(:run).returns(Object.new).at_least_once

      loader   = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, ogr2ogr_mock, @georeferencer)

      loader.run
    end

    it 'logs the exit code from ogr2ogr' do
      @loader.run
      (@job.logger.to_s =~ /ogr2ogr exit code:\s+\d+/).should_not be nil
    end

    it 'logs any output from ogr2ogr' do
      @loader.run
      (@job.logger.to_s =~ /ogr2ogr output: \w*/).should_not be nil
    end
  end

  describe '#ogr2ogr' do

    it 'returns the passed ogr2ogr instance' do
      ogr2ogr = Object.new
      loader  = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, ogr2ogr, @georeferencer)

      loader.ogr2ogr.should eq ogr2ogr
    end

    it 'initializes an ogr2ogr command wrapper if none passed' do
      loader  = CartoDB::Importer2::Loader.new(@job, @source_file)
      loader.ogr2ogr.class.name.should eq 'CartoDB::Importer2::Ogr2ogr'
    end
  end

  describe 'stats logger' do
    before do
      resultset = OpenStruct.new(:first => {:count => 10})
      db = Object.new
      db.stubs(:fetch).returns(resultset)
      @job            = CartoDB::Importer2::Doubles::Job.new(db)
      @source_file    = CartoDB::Importer2::SourceFile.new('/var/tmp/foo')
      @ogr2ogr        = CartoDB::Importer2::Doubles::Ogr2ogr.new
      @georeferencer  = CartoDB::Importer2::Doubles::Georeferencer.new
      @loader         = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
      @importer_stats_spy = CartoDB::Doubles::ImporterStats.instance
    end

    it 'logs stats' do
      loader  = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
      loader.set_importer_stats(@importer_stats_spy)
      loader.run
      @importer_stats_spy.timed_block_suffix_count('loader').should eq 1
      @importer_stats_spy.timed_block_suffix_count('loader.normalize').should eq 1
      @importer_stats_spy.timed_block_suffix_count('loader.ogr2ogr').should eq 1
      @importer_stats_spy.timed_block_suffix_count('loader.post_ogr2ogr_tasks').should eq 1

    end

  end

end


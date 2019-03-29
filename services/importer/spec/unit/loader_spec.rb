# encoding: utf-8
require 'ostruct'
require_relative '../../../../spec/spec_helper_min'
require_relative '../../lib/importer/loader'
require_relative '../../lib/importer/source_file'
require_relative '../../lib/importer/exceptions'
require_relative '../doubles/job'
require_relative '../doubles/ogr2ogr'
require_relative '../doubles/georeferencer'
require_relative '../../spec/doubles/importer_stats'

describe CartoDB::Importer2::Loader do
  before do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
    resultset = OpenStruct.new(:first => {:num_rows => 10})
    db = Object.new
    db.stubs(:fetch).returns(resultset)
    @job            = CartoDB::Importer2::Doubles::Job.new(db)
    @source_file    = CartoDB::Importer2::SourceFile.new('/var/tmp/foo')
    @ogr2ogr        = CartoDB::Importer2::Doubles::Ogr2ogr.new
    @georeferencer  = CartoDB::Importer2::Doubles::Georeferencer.new
    @loader         = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

  describe '#run' do

    it 'logs the database connection options used' do
      @loader.run
      (@job.logger.to_s. =~ /#{@job.pg_options.keys.first}/).should_not be nil
    end

    it 'runs the ogr2ogr command to load the file' do
      ogr2ogr_mock = mock
      ogr2ogr_mock.stubs(:generic_error?).returns(false).twice
      ogr2ogr_mock.stubs(:command).returns('')
      ogr2ogr_mock.stubs(:command_output).returns('')
      ogr2ogr_mock.stubs(:encoding_error?).returns(false)
      ogr2ogr_mock.stubs(:invalid_dates?).returns(false)
      ogr2ogr_mock.stubs(:duplicate_column?).returns(false)
      ogr2ogr_mock.stubs(:invalid_geojson?).returns(false)
      ogr2ogr_mock.stubs(:too_many_columns?).returns(false)
      ogr2ogr_mock.stubs(:unsupported_format?).returns(false)
      ogr2ogr_mock.stubs(:file_too_big?).returns(false)
      ogr2ogr_mock.stubs(:statement_timeout?).returns(false)
      ogr2ogr_mock.stubs(:duplicate_column?).returns(false)
      ogr2ogr_mock.stubs(:segfault_error?).returns(false)
      ogr2ogr_mock.stubs(:kml_style_missing?).returns(false)
      ogr2ogr_mock.stubs(:missing_srs?).returns(false)
      ogr2ogr_mock.stubs(:geometry_validity_error?).returns(false)
      ogr2ogr_mock.stubs(:exit_code).returns(0)
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

    it 'encoding problem importing but return 0, should try fallback and then raise an error' do
      resultset = OpenStruct.new(:first => {:num_rows => 0})
      db = Object.new
      db.stubs(:fetch).returns(resultset)
      @job  = CartoDB::Importer2::Doubles::Job.new(db)
      # Enter fallback
      @ogr2ogr.stubs(:generic_error?).returns(true)
      # Fails after fallback
      @ogr2ogr.stubs(:encoding_error?).returns(true)
      @ogr2ogr.stubs(:exit_code).returns(0)
      loader = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
      loader.expects(:try_fallback).once
      expect { loader.run }.to raise_error(CartoDB::Importer2::RowsEncodingColumnError)
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

    it 'processes ogr2ogr generic errors' do
      loader = CartoDB::Importer2::Loader.new(@job, @source_file)
      loader.ogr2ogr.stubs(generic_error?: true, command: ['ogr2ogr', '-some', '-option'])
      loader.send(:job).logger.stubs(:append)

      expect { loader.send(:check_for_import_errors) }.to raise_error CartoDB::Importer2::LoadError
    end
  end

  describe 'stats logger' do
    before do
      resultset = OpenStruct.new(:first => {:num_rows => 10})
      db = Object.new
      db.stubs(:fetch).returns(resultset)
      @job            = CartoDB::Importer2::Doubles::Job.new(db)
      @source_file    = CartoDB::Importer2::SourceFile.new('/var/tmp/foo')
      @ogr2ogr        = CartoDB::Importer2::Doubles::Ogr2ogr.new
      @georeferencer  = CartoDB::Importer2::Doubles::Georeferencer.new
      @loader         = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
      @importer_stats_spy = CartoDB::Doubles::Stats::Importer.instance
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


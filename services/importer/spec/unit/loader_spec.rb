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
    allow(CartoDB::Stats::Aggregator).to receive(:read_config).and_return({})
    resultset = OpenStruct.new(:first => {:num_rows => 10})
    db = Object.new
    allow(db).to receive(:fetch).and_return(resultset)
    @job            = CartoDB::Importer2::Doubles::Job.new(db)
    @source_file    = CartoDB::Importer2::SourceFile.new('/var/tmp/foo')
    @ogr2ogr        = CartoDB::Importer2::Doubles::Ogr2ogr.new
    @georeferencer  = CartoDB::Importer2::Doubles::Georeferencer.new
    @loader         = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
  end

  before(:each) do
    allow(CartoDB::Stats::Aggregator).to receive(:read_config).and_return({})
  end

  describe '#run' do

    it 'logs the database connection options used' do
      @loader.run
      (@job.logger.to_s. =~ /#{@job.pg_options.keys.first}/).should_not be nil
    end

    it 'runs the ogr2ogr command to load the file' do
      ogr2ogr_mock = double
      allow(ogr2ogr_mock).to receive(:generic_error?).and_return(false).twice
      allow(ogr2ogr_mock).to receive(:command).and_return('')
      allow(ogr2ogr_mock).to receive(:command_output).and_return('')
      allow(ogr2ogr_mock).to receive(:encoding_error?).and_return(false)
      allow(ogr2ogr_mock).to receive(:invalid_dates?).and_return(false)
      allow(ogr2ogr_mock).to receive(:duplicate_column?).and_return(false)
      allow(ogr2ogr_mock).to receive(:invalid_geojson?).and_return(false)
      allow(ogr2ogr_mock).to receive(:too_many_columns?).and_return(false)
      allow(ogr2ogr_mock).to receive(:unsupported_format?).and_return(false)
      allow(ogr2ogr_mock).to receive(:file_too_big?).and_return(false)
      allow(ogr2ogr_mock).to receive(:statement_timeout?).and_return(false)
      allow(ogr2ogr_mock).to receive(:duplicate_column?).and_return(false)
      allow(ogr2ogr_mock).to receive(:segfault_error?).and_return(false)
      allow(ogr2ogr_mock).to receive(:kml_style_missing?).and_return(false)
      allow(ogr2ogr_mock).to receive(:missing_srs?).and_return(false)
      allow(ogr2ogr_mock).to receive(:geometry_validity_error?).and_return(false)
      allow(ogr2ogr_mock).to receive(:exit_code).and_return(0)
      allow(ogr2ogr_mock).to receive(:run).and_return(Object.new).at_least(:once)

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
      allow(db).to receive(:fetch).and_return(resultset)
      @job  = CartoDB::Importer2::Doubles::Job.new(db)
      # Enter fallback
      allow(@ogr2ogr).to receive(:generic_error?).and_return(true)
      # Fails after fallback
      allow(@ogr2ogr).to receive(:encoding_error?).and_return(true)
      allow(@ogr2ogr).to receive(:exit_code).and_return(0)
      loader = CartoDB::Importer2::Loader.new(@job, @source_file, layer=nil, @ogr2ogr, @georeferencer)
      expect(loader).to receive(:try_fallback).once
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
      allow(loader.ogr2ogr).to receive_messages(generic_error?: true, command: ['ogr2ogr', '-some', '-option'])
      allow(loader.send(:job).logger).to receive(:append)

      expect { loader.send(:check_for_import_errors) }.to raise_error CartoDB::Importer2::LoadError
    end
  end

  describe 'stats logger' do
    before do
      resultset = OpenStruct.new(:first => {:num_rows => 10})
      db = Object.new
      allow(db).to receive(:fetch).and_return(resultset)
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


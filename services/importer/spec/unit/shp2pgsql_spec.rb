# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/shp2pgsql'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe Shp2pgsql do
  before do
    fixture_path      = '../fixtures/TM_WORLD_BORDERS_SIMPL-0.3.shp'
    @filepath         = File.expand_path(fixture_path, File.dirname(__FILE__))
    @pg_options       = Factories::PGConnection.new.pg_options
    @table_name       = "importer_#{rand(99999)}"
    @db               = Factories::PGConnection.new.connection
    @dataset          = @db[@table_name.to_sym]
    @full_table_name  = "importer.#{@table_name}"
    @wrapper          = Shp2pgsql.new(@full_table_name, @filepath, @pg_options)

    @db.execute('SET search_path TO importer,public')
  end

  after do
    @db.drop_table? @full_table_name
    @db.disconnect
  end

  describe '#prj?' do
    it 'returns true if prj available for the SHP file' do
      @wrapper.prj?.must_equal true
    end
  end #prj?

  describe '#run' do
    it 'raises if no prj available' do
      wrapper = Shp2pgsql.new(@full_table_name, 'bogus.shp', @pg_options)
      wrapper.prj?.must_equal false
      lambda { wrapper.run }.must_raise NoPrjAvailableError
    end

    it 'raises if the SHP has an invalid SRID' do
      skip
    end

    it 'raises if shp2pgsql command finishes with errors' do
      skip
    end
  end #run

  describe '#normalize' do
    it 'raises if normalization fails' do
      wrapper = Shp2pgsql.new(@full_table_name, 'bogus.shp', @pg_options)
      lambda { wrapper.normalize }.must_raise ShpNormalizationError
    end

    it 'raises if no projection detected' do
      wrapper = Shp2pgsql.new(@full_table_name, 'bogus.shp', @pg_options)
      begin
        wrapper.normalize
      rescue
        wrapper.detected_projection.must_be_nil
      end
    end
  end #normalize

  describe '#normalized?' do
    it 'returns true if normalizer executed and detected a projection' do
      skip
    end
  end

  describe '#detected_projection' do
    it 'returns the detected projection' do
      @wrapper.normalize
      @wrapper.detected_projection.must_equal 4326
    end

    it 'returns nil if none detected' do
      fake_normalizer_output = {
        projection:   'None',
        encoding:     'bogus',
        source:       'bogus',
        destination:  'bogus'
      }
      wrapper = Shp2pgsql.new(@full_table_name, 'bogus.shp', @pg_options)
      wrapper.send :normalizer_output=, fake_normalizer_output
      wrapper.detected_projection.must_be_nil
    end
  end #detected_projection

  describe '#detected_encoding' do
    it 'returns the detected encoding' do
      @wrapper.normalize
      @wrapper.detected_encoding.must_equal 'LATIN1'
    end
    
    it 'returns LATIN1 by default' do
      fake_normalizer_output = {
        projection:   'bogus',
        encoding:     'None',
        source:       'bogus',
        destination:  'bogus'
      }
      wrapper = Shp2pgsql.new(@full_table_name, 'bogus.shp', @pg_options)
      wrapper.send :normalizer_output=, fake_normalizer_output
      wrapper.detected_encoding.must_equal 'LATIN1'
    end

    it 'returns LATIN1 if detected windows codepage' do
      fake_normalizer_output = {
        projection:   'bogus',
        encoding:     'windows',
        source:       'bogus',
        destination:  'bogus'
      }
      wrapper = Shp2pgsql.new(@full_table_name, 'bogus.shp', @pg_options)
      wrapper.send :normalizer_output=, fake_normalizer_output
      wrapper.detected_encoding.must_equal 'LATIN1'
    end
  end #detected_encoding
end # Shp2pgsql


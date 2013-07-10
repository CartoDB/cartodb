# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'pg'
require 'sequel'
require_relative '../../lib/importer/shp2pgsql'
require_relative '../doubles/job'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe Shp2pgsql do
  before do
    fixture_path      = '../fixtures/TM_WORLD_BORDERS_SIMPL-0.3.shp'
    @filepath         = File.expand_path(fixture_path, File.dirname(__FILE__))
    @pg_options       = Factories::PGConnection.new.pg_options
    @table_name       = "importer_#{rand(999)}"
    @db               = Factories::PGConnection.new.connection
    @dataset          = @db[@table_name.to_sym]
    @full_table_name  = "importer.#{@table_name}"
    @wrapper          = Shp2pgsql.new(@full_table_name, @filepath, @pg_options)

    @db.execute('SET search_path TO importer,public')
  end

  after do
    @db.drop_table? @full_table_name
  end

  describe '#executable_path' do
    it 'returns the path to the shp2pgsql binary' do
      @wrapper.executable_path.must_match /shp2pgsql/
    end
  end #executable_path

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
  end #run

  describe '#normalize' do
    it 'raises if normalization fails' do
      wrapper = Shp2pgsql.new(@full_table_name, 'bogus.shp', @pg_options)
      lambda { wrapper.normalize }.must_raise ShpNormalizationError
    end
  end #normalize
end # Shp2pgsql


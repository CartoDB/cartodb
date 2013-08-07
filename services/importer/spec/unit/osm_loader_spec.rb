# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'sqlite3'
require_relative '../../lib/importer/osm_loader'
require_relative '../../lib/importer/source_file'
require_relative '../../lib/importer/job'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe OsmLoader do
  before do
    @pg_connection  = Factories::PGConnection.new
    @job            = Job.new(pg_options: @pg_connection.pg_options)
    fixture         = File.expand_path(
                        '../fixtures/map2.osm', File.dirname(__FILE__)
                      )
    @source_file    = SourceFile.new(fixture)
    @osm_loader     = OsmLoader.new(@job, @source_file)
  end

  describe '#run' do
    it 'loads OSM data into Postgres' do
      @osm_loader.run
    end
  end #run

  describe '#process' do
    it 'renames the OSM geometry column to the_geom' do
    end

    it 'normalizes the_geom' do
    end

    it 'revokes public privileges' do
    end
  end #run

  describe '#suffixed_table_names' do
    it 'returns the names of the tables after OSM data loaded' do
      @osm_loader.suffixed_table_names.count
        .must_equal OsmLoader::TABLE_SUFFIXES.count
      @osm_loader.suffixed_table_names.each do |suffixed_table_name|
        suffixed_table_name.must_match /#{@job.table_name}/
      end
    end
  end #suffixed_table_names

  describe '#valid_table_names' do
    it 'returns those suffixed table names with actual data' do
    end
  end #valid_table_names

  describe '#invalid_table_names' do
    it 'returns those suffixed table names with NO actual data' do
    end
  end #invalid_table_names

  describe '#rename_column' do
  end #rename_column

  describe '#normalize_the_geom_in' do
  end #normalize_the_geom_in

  describe '#revoke_all_privileges_from_public_in' do
  end #revoke_all_privileges_from_public_in
end #OsmLoader


# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/osm2pgsql'
require_relative '../factories/pg_connection'

include CartoDB::Importer2


describe Osm2Pgsql do
  before do
    fixture_path      = '../fixtures/map2.osm'
    @filepath         = File.expand_path(fixture_path, File.dirname(__FILE__))
    @pg_options       = Factories::PGConnection.new.pg_options
    @table_name       = "importer_#{rand(99999)}"
    @db               = Factories::PGConnection.new.connection
    @dataset          = @db[@table_name.to_sym]
    @full_table_name  = "cdb_importer.#{@table_name}"
    @wrapper          = Osm2Pgsql.new(@table_name, @filepath, @pg_options)

    @db.execute('SET search_path TO cdb_importer,public')
  end

  after do
    %w{ ways nodes rels point line polygon roads}.each do |suffix|
      @db.drop_table? "#{@table_name}_#{suffix}"
      @db.disconnect
    end
  end

  describe '#command' do
    it 'returns the full command line to be executed' do
      @wrapper.command.must_match /geometry.*latlong.*/
      @wrapper.command.must_match /#{@qualified_table_name}/
      @wrapper.command.must_match /#{@filepath}/
    end
  end

  describe '#executable_path' do
    it 'returns the absolute path of the osm2pgsql binary' do
      @wrapper.executable_path.must_match /osm2pgsql/
    end
  end #executable_path

  describe '#run' do
    it 'loads the OSM data into the database' do
      @wrapper.run
      Sequel.postgres(@pg_options)[%Q(
        SELECT count(*)
        FROM #{@table_name}_line
      )].to_a.wont_be_empty
    end
  end #run
end # Osm2Pgsql


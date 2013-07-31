# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../factories/pg_connection'
require_relative '../../lib/importer/indexer'

include CartoDB::Importer2

describe Indexer do
  before do
    @db         = Factories::PGConnection.new.connection
    @indexer    = Indexer.new(@db)
    @table_name = "test_#{Time.now.to_i}"

    @db.run(%Q(DROP TABLE IF EXISTS "cdb_importer".#{@table_name}))
    @db.run(%Q{CREATE TABLE "cdb_importer".#{@table_name} ( the_geom geometry )})
  end

  after do
    @db.run(%Q(DROP TABLE IF EXISTS "cdb_importer".#{@table_name}))
    @db.disconnect
  end

  describe '#add' do
    it 'adds an index for the_geom on the passed table' do
      indexes_for(@table_name).must_be_empty
      @indexer.add(@table_name)
      indexes_for(@table_name).wont_be_empty
    end
  end #add

  describe '#drop' do
    it 'drops an existing index from the database' do
      @indexer.add(@table_name)
      indexes_for(@table_name).length.must_equal 1

      index_name = "#{@table_name}_the_geom_gist"

      @indexer.drop(index_name)
      indexes_for(@table_name).must_be_empty
    end
  end #drop

  def indexes_for(table_name)
    @db[%Q{
      SELECT *
      FROM pg_indexes
      WHERE tablename = '#{@table_name}'
    }].to_a
  end #indexes_for
end # Indexer


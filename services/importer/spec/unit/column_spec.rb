# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../column'
require_relative '../factories/pg_connection'

include CartoDB::Importer

describe Column do
  before do
    @db           = Factories::PGConnection.new.connection
    @table_name   = create_table(@db)
    @column_name  = 'the_geom'
    @column       = Column.new(@db, @table_name, @column_name)
    @dataset      = @db[@table_name.to_sym]
  end

  after do
    @db.drop_table?(@table_name)
  end

  describe '#type' do
    it 'returns the type of the column as returned by the database' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.type.must_equal 'text'
      @column.geometrify
      @column.type.must_match 'geometry'
    end
  end #type

  describe '#geometrify' do
    it "parses and updates the passed geometry column if it's in WKT" do
      5.times { @dataset.insert(random_wkt_record) }
      @column.geometrify
    end

    it 'handles empty geometry columns' do
      5.times { @dataset.insert(name: '', description:'', the_geom: '') }
      @column.geometrify
    end

    it "guarantees the geometry column ends up with a geometry type" do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.geometrify
      @column.type.must_match /geometry/
    end
  end #parse

  describe '#convert_from_wkt' do
    it 'populates an existing geometry column parsing its values in WKT' do
      @dataset.insert(random_wkt_record)

      @column.convert_from_wkt
      @column.sample.must_match /^0101/
    end

    it "raises if column contents aren't in WKT" do
      @dataset.insert(name: 'bogus', description: 'bogus', the_geom: 'bogus')

      lambda { @column.convert_from_wkt }.must_raise Sequel::DatabaseError
    end
  end #convert_from_wkt

  describe '#wkb?' do
    it 'returns true if the passed column contains geometries in WKB' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.wkb?.must_equal true
    end

    it 'returns false otherwise' do
      @dataset.insert(name: 'bogus', description: 'bogus', the_geom: 'bogus')
      @column.wkb?.must_equal false
    end
  end #wkb?

  describe '#cast_to' do
    it 'casts the passed column to a geometry type' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.type.must_equal 'text'
      @column.cast_to('geometry')
      @column.type.must_match 'geometry'
    end

    it "raises if column contents aren't geometries" do
      @dataset.insert(
        name: 'bogus', description: 'bogus', the_geom: 'bogus'
      )

      lambda { @column.cast_to('geometry') }.must_raise Sequel::DatabaseError
    end
  end #cast_to

  describe '#sample' do
    it "retrieves the passed column from the first record
    where it isn't null" do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.sample.must_match /0101/
    end

    it 'returns nil if no records with data in the column' do
      @column.sample.must_be_nil
    end
  end # sample

  describe '#records_with_data' do
    it 'returns a dataset with those records with  data in this column' do
      @column.records_with_data.must_be_empty
      @column.records_with_data.must_be_instance_of Sequel::Postgres::Dataset

      @dataset.insert(random_wkt_record)
      @column.records_with_data.wont_be_empty
    end
  end #records_with_data

  describe '#empty?' do
    it 'returns true if no records with data in this column' do
      @column.empty?.must_equal true
      @dataset.insert(random_wkt_record)
      @column.empty?.must_equal false
    end
  end #empty?

  def create_table(db, options={})
    table_name = options.fetch(:table_name, "importer_#{rand(999)}")
    db.create_table? table_name do
      String  :name
      String  :description
      String  :the_geom
    end

    table_name
  end #create_table

  def random_hexewkb_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     "0101000020E61000004486E281C5C257C068B89DDA998F4640"
    }
  end #random_hexewkb_record

  def random_wkt_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     'POINT(-71.060316 48.432044)'
    }
  end #random_wkt_record
end # Column


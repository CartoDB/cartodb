# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../geometry_processor'
require_relative '../factories/pg_connection'

include CartoDB::Importer

describe GeometryProcessor do
  before do
    @db           = Factories::PGConnection.new.connection
    @table_name   = create_table(@db)
  end

  after do
    @db.drop_table?(@table_name)
  end

  describe '#parse' do
    it "parses and updates the passed geometry column if it's in WKT" do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      5.times { @db[@table_name.to_sym].insert(random_wkt_record) }
      processor.parse(column_name)
    end

    it "guarantees the geometry column ends up with a geometry type" do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      5.times { @db[@table_name.to_sym].insert(random_hexewkb_record) }
      processor.parse(column_name)
    end
  end #parse

  describe '#convert_from_wkt' do
    it 'populates an existing geometry column parsing its values in WKT' do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      @db[@table_name.to_sym].insert(random_wkt_record)

      processor.convert_from_wkt(column_name)
      @db[@table_name.to_sym].first.fetch(:the_geom).must_match /^0101/
    end

    it "raises if column contents aren't in WKT" do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      @db[@table_name.to_sym]
        .insert(name: 'bogus', description: 'bogus', the_geom: 'bogus')

      lambda { processor.convert_from_wkt(column_name) }
        .must_raise Sequel::DatabaseError
    end
  end #convert_from_wkt

  describe '#is_wkb?' do
    it 'returns true if the passed column contains geometries in WKB' do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      5.times { @db[@table_name.to_sym].insert(random_hexewkb_record) }
      processor.is_wkb?(column_name).must_equal true
    end

    it 'returns false otherwise' do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      @db[@table_name.to_sym].insert(
        name: 'bogus', description: 'bogus', the_geom: 'bogus'
      )

      processor.is_wkb?(column_name).must_equal false
    end
  end #is_wkb?

  describe '#cast_to_geometry' do
    it 'casts the passed column to a geometry type' do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      5.times { @db[@table_name.to_sym].insert(random_hexewkb_record) }
      processor.cast_to_geometry(column_name)
    end

    it "raises if column contents aren't geometries" do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      @db[@table_name.to_sym].insert(
        name: 'bogus', description: 'bogus', the_geom: 'bogus'
      )

      lambda { processor.cast_to_geometry(column_name) }
        .must_raise Sequel::DatabaseError
    end
  end #cast_to_geometry

  describe '#sample_geometry_from' do
    it "retrieves the passed geometry column from the first record
    where it isn't null" do
      column_name = 'the_geom'
      processor   = GeometryProcessor.new(@db, @table_name)

      5.times { @db[@table_name.to_sym].insert(random_hexewkb_record) }
      processor.sample_geometry_from(column_name).wont_be_nil
      processor.sample_geometry_from(column_name).must_match /0101/
    end
  end # sample_geometry_from

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
      the_geom: 'POINT(-71.060316 48.432044)'
    }
  end #random_wkt_record
end


# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/column'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe Column do
  before do
    @db           = Factories::PGConnection.new.connection
    @db.execute('SET search_path TO cdb_importer,public')

    @table_name   = create_table(@db)
    @column_name  = 'the_geom'
    @column       = Column.new(@db, @table_name, @column_name)
    @dataset      = @db[@table_name.to_sym]
  end

  after do
    @db.drop_table?(@table_name.to_sym)
    @db.disconnect
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

    it 'raises if empty geometry column' do
      5.times { @dataset.insert(name: '', description:'', the_geom: '') }
      lambda { @column.geometrify }.must_raise RuntimeError
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
      @dataset.insert(bogus_record)

      lambda { @column.convert_from_wkt }.must_raise Sequel::DatabaseError
    end
  end #convert_from_wkt

  describe '#convert_from_geojson' do
    it 'populates an existing geometry column parsing its values in GeoJSON' do
      @dataset.insert(random_geojson_record)

      @column.convert_from_geojson
      @column.sample.must_match /^0101/
    end

    it "raises if column contents aren't in GeoJSON" do
      @dataset.insert(bogus_record)

      lambda { @column.convert_from_geojson }.must_raise Sequel::DatabaseError
    end
  end

  describe '#convert_from_kml_point' do
    it 'populates an existing geometry column parsing its values in KML Point' do
      @dataset.insert(random_kml_point_record)

      @column.convert_from_kml_point
      @column.sample.must_match /^0101/
    end

    it "raises if column contents aren't in KML Point" do
      @dataset.insert(bogus_record)

      lambda { @column.convert_from_kml_point }.must_raise Sequel::DatabaseError
    end
  end
  
  describe '#convert_from_kml_multi' do
    it 'populates an existing geometry column parsing its values in KML Multi' do
      @dataset.insert(random_kml_multi_record)

      @column.convert_from_kml_multi
      @column.sample.must_match /^0105/
    end

    it "raises if column contents aren't in KML Point" do
      @dataset.insert(bogus_record)

      lambda { @column.convert_from_kml_multi }.must_raise Sequel::DatabaseError
    end
  end

  describe '#wkb?' do
    it 'returns true if the passed column contains geometries in WKB' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.wkb?.must_equal true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.wkb?.must_equal false
    end
  end #wkb?

  describe '#geojson?' do
    it 'returns true if the passed column contains geometries in WKB' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.wkb?.must_equal true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.wkb?.must_equal false
    end
  end

  describe '#kml_point?' do
    it 'returns true if the passed column contains geometries in KML Point' do
      5.times { @dataset.insert(random_kml_point_record) }
      @column.kml_point?.must_equal true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.kml_point?.must_equal false
    end
  end

  describe '#kml_multi?' do
    it 'returns true if the passed column contains geometries in KML Multi' do
      5.times { @dataset.insert(random_kml_multi_record) }
      @column.kml_multi?.must_equal true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.kml_multi?.must_equal false
    end
  end

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

  describe '#rename_to' do
    it 'renames the column' do
      @dataset.insert(random_hexewkb_record)
      @column.rename_to('bogus_name')
      @dataset.first.keys.must_include :bogus_name
    end

    it 'does nothing if the new name is the same as the current one' do
      @dataset.insert(random_hexewkb_record)
      @column.rename_to('the_geom')
      @dataset.first.keys.must_include @column_name.to_sym
    end
  end #rename_to

  describe '#sanitized_name' do
    it 'returns a sanitized version of the column name' do
      Column.new(@db, @table_name, '+++sanitized+++').sanitized_name
        .must_equal 'sanitized'
    end

    it 'returns the same name if no sanitization needed' do
      Column.new(@db, @table_name, 'sanitized').sanitized_name
        .must_equal 'sanitized'
    end
  end #sanitized_name

  describe '#reserved?' do
    it 'returns true if name is a reserved keyword' do
      @column.reserved?('select').must_equal true
      @column.reserved?('bogus').must_equal false
    end
  end #reserved?

  describe '#unsupported?' do
    it 'returns true if name is not supported by Postgres' do
      @column.unsupported?('9name').must_equal true
      @column.unsupported?('name9').must_equal false
    end
  end #unsupported?

  def create_table(db, options={})
    table_name = options.fetch(:table_name, "importer_#{rand(99999)}")
    db.drop_table?(table_name)
    db.create_table?(table_name) do
      String  :name
      String  :description
      String  :the_geom
    end

    table_name
  rescue
    db.run(%Q{DROP TABLE "cdb_importer"."#{table_name}"})
    table_name
  end #create_table

  def bogus_record
    {
      name: 'bogus',
      description: 'bogus',
      the_geom: 'bogus'
    }
  end #bogus_record

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

  def random_geojson_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     { type: "Point", coordinates: [102.0, 0.5] }.to_json
    }
  end #random_geojson_record

  def random_kml_point_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     "<Point><coordinates>137.625,36.975</coordinates></Point>"
    }
  end #random_kml_point_record

  def random_kml_multi_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     %Q{
                      <LineString>
                        <coordinates>
                          -112.2550785337791,36.07954952145647,2357
                          -112.2549277039738,36.08117083492122,2357
                          -112.2552505069063,36.08260761307279,2357
                          -112.2564540158376,36.08395660588506,2357
                          -112.2580238976449,36.08511401044813,2357
                          -112.2595218489022,36.08584355239394,2357
                          -112.2608216347552,36.08612634548589,2357
                          -112.262073428656,36.08626019085147,2357
                          -112.2633204928495,36.08621519860091,2357
                          -112.2644963846444,36.08627897945274,2357
                          -112.2656969554589,36.08649599090644,2357 
                        </coordinates>
                      </LineString>
                    } 
    }
  end #random_kml_multi_record
end # Column


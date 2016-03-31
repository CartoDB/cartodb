# encoding: utf-8
require_relative '../../lib/importer/column'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
require_relative '../../../../spec/rspec_configuration.rb'
require_relative '../../../../spec/spec_helper'

include CartoDB::Importer2

describe Column do
  before(:all) do
    @user         = create_user
    @user.save
    @db           = @user.in_database
    @db.execute('CREATE SCHEMA IF NOT EXISTS cdb_importer')
    @db.execute('CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public')
    @db.execute('CREATE EXTENSION IF NOT EXISTS postgis_topology')
    @db.execute('SET search_path TO cdb_importer,public')
  end

  before(:each) do
    @table_name   = create_table(@db)
    @column_name  = 'the_geom'
    @column       = Column.new(@db, @table_name, @column_name, @user, Column::DEFAULT_SCHEMA, nil, CartoDB::Importer2::Doubles::Log.new(@user), capture_exceptions = false)
    @dataset      = @db[@table_name.to_sym]
  end

  after(:each) do
    @db.drop_table?(@table_name.to_sym)
  end

  after(:all) do
    @db.execute('DROP SCHEMA cdb_importer CASCADE')
    @db.disconnect
  end

  describe '#type' do
    it 'returns the type of the column as returned by the database' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.type.should eq 'text'
      @column.geometrify
      @column.type.should match 'geometry'
    end
  end #type

  describe '#geometrify' do
    it "parses and updates the passed geometry column if it's in WKT" do
      5.times { @dataset.insert(random_wkt_record) }
      @column.geometrify
    end

    it 'raises if empty geometry column' do
      5.times { @dataset.insert(name: '', description:'', the_geom: '') }
      lambda { @column.geometrify }.should raise_error RuntimeError
    end

    it "guarantees the geometry column ends up with a geometry type" do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.geometrify
      @column.type.should match /geometry/
    end
  end #parse

  describe '#convert_from_wkt' do
    it 'populates an existing geometry column parsing its values in WKT' do
      @dataset.insert(random_wkt_record)

      @column.convert_from_wkt
      @column.sample.should match /^0101/
    end

    it "raises if column contents aren't in WKT" do
      @dataset.insert(bogus_record)

      lambda { @column.convert_from_wkt }.should raise_error Sequel::DatabaseError
    end
  end #convert_from_wkt

  describe '#convert_from_geojson' do
    it 'populates an existing geometry column parsing its values in GeoJSON' do
      @dataset.insert(random_geojson_record)

      @column.convert_from_geojson
      @column.sample.should match /^0101/
    end

    it "raises if column contents aren't in GeoJSON" do
      @dataset.insert(bogus_record)

      lambda { @column.convert_from_geojson }.should raise_error Sequel::DatabaseError
    end
  end

  describe '#convert_from_kml_point' do
    it 'populates an existing geometry column parsing its values in KML Point' do
      @dataset.insert(random_kml_point_record)

      @column.convert_from_kml_point
      @column.sample.should match /^0101/
    end

    it "raises if column contents aren't in KML Point" do
      @dataset.insert(bogus_record)

      lambda { @column.convert_from_kml_point }.should raise_error Sequel::DatabaseError
    end
  end

  describe '#convert_from_kml_multi' do
    it 'populates an existing geometry column parsing its values in KML Multi' do
      @dataset.insert(random_kml_multi_record)
      @column.convert_from_kml_multi
      @column.sample.should match /^0105/
    end

    it "raises if column contents aren't in KML Point" do
      @dataset.insert(bogus_record)

      expect { @column.convert_from_kml_multi }.to raise_error Sequel::DatabaseError
    end
  end

  describe '#wkb?' do
    it 'returns true if the passed column contains geometries in WKB' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.wkb?.should eq true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.wkb?.should eq false
    end
  end #wkb?

  describe '#geojson?' do
    it 'returns true if the passed column contains geometries in WKB' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.wkb?.should eq true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.wkb?.should eq false
    end
  end

  describe '#kml_point?' do
    it 'returns true if the passed column contains geometries in KML Point' do
      5.times { @dataset.insert(random_kml_point_record) }
      @column.kml_point?.should eq true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.kml_point?.should eq false
    end
  end

  describe '#kml_multi?' do
    it 'returns true if the passed column contains geometries in KML Multi' do
      5.times { @dataset.insert(random_kml_multi_record) }
      @column.kml_multi?.should eq true
    end

    it 'returns false otherwise' do
      @dataset.insert(bogus_record)
      @column.kml_multi?.should eq false
    end
  end

  describe '#cast_to' do
    it 'casts the passed column to a geometry type' do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.type.should eq 'text'
      @column.cast_to('geometry')
      @column.type.should match 'geometry'
    end

    it "raises if column contents aren't geometries" do
      @dataset.insert(
        name: 'bogus', description: 'bogus', the_geom: 'bogus'
      )
      expect { @column.cast_to('geometry') }.to raise_error Sequel::DatabaseError
    end
  end #cast_to

  describe '#sample' do
    it "retrieves the passed column from the first record
    where it isn't null" do
      5.times { @dataset.insert(random_hexewkb_record) }
      @column.sample.should match /0101/
    end

    it 'returns nil if no records with data in the column' do
      @column.sample.should_not be
    end
  end # sample

  describe '#records_with_data' do
    it 'returns a dataset with those records with  data in this column' do
      @column.records_with_data.should be_empty
      @column.records_with_data.should be_an_instance_of Sequel::Postgres::Dataset

      @dataset.insert(random_wkt_record)
      @column.records_with_data.should_not be_empty
    end
  end #records_with_data

  describe '#empty?' do
    it 'returns true if no records with data in this column' do
      @column.empty?.should eq true
      @dataset.insert(random_wkt_record)
      @column.empty?.should eq false
    end
  end #empty?

  describe '#rename_to' do

    it 'renames the column' do
      @dataset.insert(random_hexewkb_record)
      @column.rename_to('bogus_name')
      @dataset.first.keys.should include :bogus_name
    end

    it 'does nothing if the new name is the same as the current one' do
      @dataset.insert(random_hexewkb_record)
      @column.rename_to('the_geom')
      @dataset.first.keys.should include @column_name.to_sym
    end
  end #rename_to

  describe '#sanitized_name' do
    it 'returns a sanitized version of the column name' do
      Column.new(@db, @table_name, '+++sanitized+++', Column::DEFAULT_SCHEMA, nil, CartoDB::Importer2::Doubles::Log.new(@user)).sanitized_name
        .should eq 'sanitized'
    end

    it 'returns the same name if no sanitization needed' do
      Column.new(@db, @table_name, 'sanitized', Column::DEFAULT_SCHEMA, nil, CartoDB::Importer2::Doubles::Log.new(@user)).sanitized_name
        .should eq 'sanitized'
    end
  end #sanitized_name

  describe '#reserved?' do
    it 'returns true if name is a reserved keyword' do
      @column.reserved?('select').should eq true
      @column.reserved?('bogus').should eq false
    end
  end #reserved?

  describe '#unsupported?' do
    it 'returns true if name is not supported by Postgres' do
      @column.unsupported?('9name').should eq true
      @column.unsupported?('name9').should eq false
    end
  end #unsupported?

  def create_table(db, options={})
    table_name = options.fetch(:table_name, "importer_#{rand(99999)}")
    db.drop_table?(table_name)
    db.create_table?(table_name) do
      String  :name
      String  :description
      String  :the_geom
      String  :ogc_fid
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
      the_geom: 'bogus',
      ogc_fid:      1
    }
  end #bogus_record

  def random_hexewkb_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     "0101000020E61000004486E281C5C257C068B89DDA998F4640",
      ogc_fid:      1
    }
  end #random_hexewkb_record

  def random_wkt_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     'POINT(-71.060316 48.432044)',
      ogc_fid:      1
    }
  end #random_wkt_record

  def random_geojson_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     { type: "Point", coordinates: [102.0, 0.5] }.to_json,
      ogc_fid:      1
    }
  end #random_geojson_record

  def random_kml_point_record
    random = rand(999)
    {
      name:         "bogus #{rand(999)}",
      description:  "bogus #{rand(999)}",
      the_geom:     "<Point><coordinates>137.625,36.975</coordinates></Point>",
      ogc_fid:      1
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
                    },
      ogc_fid:      1
    }
  end #random_kml_multi_record
end # Column


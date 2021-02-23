require_relative '../../lib/importer/column'
require_relative '../factories/pg_connection'
require_relative '../doubles/log'
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
    @user.destroy
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
      @column.records_with_data.is_a?(Sequel::Postgres::Dataset).should be_true

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
      Column.reserved?('select').should eq true
      Column.reserved?('bogus').should eq false
    end
  end #reserved?

  describe '#unsupported?' do
    it 'returns true if name is not supported by Postgres' do
      Column.unsupported?('9name').should eq true
      Column.unsupported?('name9').should eq false
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
  rescue StandardError
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


  LEGACY_SANITIZATION_EXAMPLES = {
    "abc" => "abc",
    "abc xyz" => "abc_xyz",
    "2abc" => "column_2abc",
    "Abc" => "_bc",
    "\u0432\u044b\u0445\u043b\u043e\u043f\u044b \u0430\u0432\u0442\u043e\u0442\u0440\u0430\u043d\u0441\u043f\u043e\u0440\u0442\u04302" => "_2",
    "\u043d\u0435\u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u044b\u0439 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a2" => "_2",
    "\u0432\u044b\u0431\u0440\u043e\u0441\u044b \u043f\u0440\u0435\u0434\u043f\u0440\u0438\u044f\u0442\u0438\u04392" => "_2",
    "\u013ar" => "_r",
    "CONVERT(BlueNumber USING utf8)" => '_lue_umber_utf8_',
    "is growing site fenced?" => "is_growing_site_fenced_",
    "if it\u2019s a community garden, is it collective or allotment?" => "if_it_s_a_community_garden_is_it_collective_or_allotment_",
    "Paddock" => "_addock",
    "Date Due" => "_ate_ue",
    "__5" => "_5",
    "__1" => "_1",
    "tel\u00e9fono" => "tel_fono",
    ":@computed_region_wvic_k925" => "_computed_region_wvic_k925",
    "\u0420\u0435\u0433\u0438\u043e\u043d" => "_",
    "\u043d\u0435\u0443\u0441\u0442\u0430\u043d\u043e\u0432\u043b\u0435\u043d\u043d\u044b\u0439 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a" => "_",
    "> min" => "_min",
    "12_ schedule of visits.0" => "column_12_schedule_of_visits_0",
    "previous rent (\u00a3 per sq ft)" => "previous_rent_per_sq_ft_",
    "description/\u540d\u7a31" => "description_",
    "description/\u5730\u5740" =>  "description_",
    "@relations" =>  "_relations",
    "EntityName" => "_ntity_ame",
    "_ injured" => "_injured",
    "trips 11 _ 15 miles" => "trips_11_15_miles",
    "as" => "as",
    "any" => "any",
    "xmin" => "xmin",
    "action" => "action",
  }

  LEGACY_SANITIZATION_COLS = {
    ['выбросы предприятий2', 'выхлопы автотранспорта2', 'неустановленный источник2'] => ['_2', '_2_1', '_2_2'],
    ["description/\u540d\u7a31", "description/\u5730\u5740"] => ["description_", "description__1"]
  }

  VERSION_2_SANITIZATION_EXAMPLES = {
    "abc" => "abc",
    "abc xyz" => "abc_xyz",
    "2abc" => "_2abc",
    "Abc" => "abc",
    "выхлопы автотранспорта2" => "vyxlopy_vtotr_nsport_2",
    "неустановленный источник2" => "neust_novlennyj_istochnik2",
    "выбросы предприятий2" => "vybrosy_predpriyatij2",
    "ĺr" => "lr",
    "CONVERT(BlueNumber USING utf8)" => "convert_bluenumber_using_utf8",
    "is growing site fenced?" => "is_growing_site_fenced",
    "if it’s a community garden, is it collective or allotment?" => "if_it_s_a_community_garden_is_it_collective_or_allotment",
    "Paddock" => "paddock",
    "Date Due" => "date_due",
    "__5" => "_5",
    "__1" => "_1",
    "teléfono" => "telefono",
    ":@computed_region_wvic_k925" => "computed_region_wvic_k925",
    "Регион" => "region",
    "неустановленный источник" => "neust_novlennyj_istochnik",
    "> min" => "min",
    "12_ schedule of visits.0" => "_12_schedule_of_visits_0",
    "previous rent (£ per sq ft)" => "previous_rent_per_sq_ft",
    "description/名稱" => "description",
    "description/地址" => "description",
    "@relations" => "relations",
    "EntityName" => "entityname",
    "_ injured" => "_injured",
    "trips 11 _ 15 miles" => "trips_11_15_miles",
    "as" => "_as",
    "any" => "_any",
    "xmin" => "_xmin",
    "action" => "_action",
  }

  VERSION_2_SANITIZATION_COLS = {
    ['выбросы предприятий2', 'выхлопы автотранспорта2', 'неустановленный источник2'] => ['vybrosy_predpriyatij2', 'vyxlopy_vtotr_nsport_2', 'neust_novlennyj_istochnik2'],
    ["description/\u540d\u7a31", "description/\u5730\u5740"] => ["description", "description_1"],
    ["abc", "Abc", "aBc", "ABC"] => ["abc", "abc_1", "abc_2", "abc_3"]
  }

  describe '.get_valid_column_name' do

    it 'can apply legacy sanitization to single columns' do
      LEGACY_SANITIZATION_EXAMPLES.each do |input_name, output_name|
        name = Column::get_valid_column_name(input_name, Column::INITIAL_COLUMN_SANITIZATION_VERSION, [])
        name.should eq output_name
      end
    end

    it 'can apply legacy sanitization to multiple columns' do
      LEGACY_SANITIZATION_COLS.each do |input_columns, output_columns|
        columns = []
        input_columns.zip(output_columns).each do |input_column, output_column|
          column = Column::get_valid_column_name(input_column, Column::INITIAL_COLUMN_SANITIZATION_VERSION, columns)
          columns << column
          column.should eq output_column
        end
      end
    end

    it 'can apply sanitization v2 to single columns' do
      VERSION_2_SANITIZATION_EXAMPLES.each do |input_name, output_name|
        name = Column::get_valid_column_name(input_name, 2, [])
        name.should eq output_name
      end
    end

    it 'v2 sanitization is idempotent' do
      VERSION_2_SANITIZATION_EXAMPLES.each_key do |input_name|
        first_name = Column::get_valid_column_name(input_name, 2, [])
        second_name = Column::get_valid_column_name(first_name, 2, [])
        second_name.should eq first_name
      end
    end

    it 'can apply v2 sanitization to multiple columns' do
      VERSION_2_SANITIZATION_COLS.each do |input_columns, output_columns|
        columns = []
        input_columns.zip(output_columns).each do |input_column, output_column|
          column = Column::get_valid_column_name(input_column, 2, columns)
          puts "--- ADDING COL #{column}"
          columns << column
          puts " >> #{columns.inspect}"
          column.should eq output_column
        end
      end
    end

    it 'multiple column sanitization is idempotent' do
      VERSION_2_SANITIZATION_COLS.each_key do |input_columns|
        columns1 = []
        input_columns.each do |input_column|
          column1 = Column::get_valid_column_name(input_column, 2, columns1)
          columns1 << column1
        end
        columns2 = []
        columns1.each do |input_column|
          column2 = Column::get_valid_column_name(input_column, 2, columns2)
          columns2 << column2
          column2.should eq input_column
        end
      end
    end
  end # .get_valid_column_name

end # Column

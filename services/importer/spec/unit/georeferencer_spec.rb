# encoding: utf-8
require_relative '../../lib/importer/georeferencer.rb'
require_relative '../factories/pg_connection'

include CartoDB

describe Importer2::Georeferencer do
  before(:all) do
    @db           = Importer2::Factories::PGConnection.new.connection

    create_schema(@db, 'cdb_importer')

    @db.execute('SET search_path TO cdb_importer,public')

    @table_name   = create_table(@db)
  end

  after(:all) do
    @db.drop_table? @table_name

    #TODO Drop schema

    @db.disconnect
  end

  describe '#initialize' do
    it 'requires a db connection and a table name' do
      expect {
        Importer2::Georeferencer.new
      }.to raise_error(ArgumentError)
      
      expect {
        Importer2::Georeferencer.new(Object.new)
      }.to raise_error(ArgumentError)
      
      Importer2::Georeferencer.new(Object.new, 'bogus')
    end
  end #initialize

  describe '#run' do
    it 'generates the_geom from lat / lon columns' do
      dataset     = @db[@table_name.to_sym]

      10.times { dataset.insert(random_record) }

      georeferencer = Importer2::Georeferencer.new(@db, @table_name)
      georeferencer.run

      dataset.first.fetch(:the_geom).wont_be_nil
      dataset.first.fetch(:the_geom).wont_be_empty
    end

    it 'returns self if no lat / lon columns in the tabl' do
      table_name  = create_table(@db,
                      latitude_column: 'bogus_1',
                      longitude_column: 'bogus_2'
                    )
      dataset     = @db[table_name.to_sym]

      dataset.insert(
        :name         => 'bogus',
        :description  => 'bogus',
        :bogus_1      => rand(90),
        :bogus_2      => rand(180)
      )

      georeferencer = Importer2::Georeferencer.new(@db, @table_name)
      georeferencer.run.should eq georeferencer

      dataset.to_a.first.keys.include?(:the_geom).should eq false
    end
  end #run

  describe '#populate_the_geom_from_latlon' do
    it 'populates the_geom from lat / lon values' do
      lat = Importer2::Georeferencer::LATITUDE_POSSIBLE_NAMES.sample
      lon = Importer2::Georeferencer::LONGITUDE_POSSIBLE_NAMES.sample

      table_name = create_table(
        @db,
        latitude_column:  lat,
        longitude_column: lon
      )

      georeferencer = Importer2::Georeferencer.new(@db, table_name)
      dataset       = @db[table_name.to_sym]

      georeferencer.create_the_geom_in(table_name)
      dataset.insert(
        :name         => 'bogus',
        :description  => 'bogus',
        :"#{lat}"     => rand(90),
        :"#{lon}"     => rand(180)
      )

      dataset.first.fetch(:the_geom).must_be_nil
      georeferencer.populate_the_geom_from_latlon(table_name, lat, lon)
      dataset.first.fetch(:the_geom).wont_be_nil
    end
  end #georeference

  describe '#create_the_geom_in' do
    it 'adds a the_geom column to a table' do
      georeferencer = Importer2::Georeferencer.new(@db, @table_name)

      georeferencer.column_exists_in?(@table_name, 'the_geom')
        .should eq false
      georeferencer.create_the_geom_in(@table_name)
      georeferencer.column_exists_in?(@table_name, 'the_geom')
        .should eq true
    end

    it 'returns false if the_geom column already exists' do
      georeferencer = Importer2::Georeferencer.new(@db, @table_name)

      georeferencer.column_exists_in?(@table_name, 'the_geom')
        .should eq false
      georeferencer.create_the_geom_in(@table_name)

      georeferencer.create_the_geom_in(@table_name).should eq false
    end
  end #create_the_geom_in

  describe '#column_exists_in?' do
    it 'return true if the column exists in the table' do
      georeferencer = Importer2::Georeferencer.new(@db, @table_name)
      georeferencer.column_exists_in?(@table_name, 'non_existent')
        .should eq false
      georeferencer.column_exists_in?(@table_name, 'name')
        .should eq true
    end
  end #column_exists_in?

  describe '#columns_in' do
    it 'returns the names of columns in a table' do
      georeferencer = Importer2::Georeferencer.new(@db, @table_name)
      georeferencer.columns_in(@table_name).should include :name
      georeferencer.columns_in(@table_name).should include :description
      georeferencer.columns_in(@table_name).should include :lat
      georeferencer.columns_in(@table_name).should include :lon
    end
  end #columns_in

  describe '#latitude_column_name_in' do
    it 'returns the name of a latitude column within a set of candidates, if
    existing' do
      georeferencer = Importer2::Georeferencer.new(@db, @table_name)
      georeferencer.latitude_column_name_in(@table_name).should eq 'lat'
    end
  end

  describe '#longitude_column_name_in' do
    it 'returns the name of a longitude column within a set of candidates, if
    existing' do
      georeferencer = Importer2::Georeferencer.new(@db, @table_name)
      georeferencer.longitude_column_name_in(@table_name).should eq 'lon'
    end
  end

  describe '#find_column_in' do
    it 'returns the name of a column in a set of possible names if one of them
    actually exists in the table' do
      georeferencer = Importer2::Georeferencer.new(@db, @table_name)
      georeferencer.find_column_in(@table_name, "'name','bogus'")
        .should eq 'name'

      georeferencer.find_column_in(@table_name, "'bogus'").should eq false
    end
  end #find_column_in

  # Attempts to create a new database schema
  # Does not raise exception if the schema already exists
  def create_schema(db, schema)
    db.run(%Q{CREATE SCHEMA #{schema}})
  rescue Sequel::DatabaseError => e
    raise unless e.message =~ /schema .* already exists/
  end #create_schema

  def create_table(db, options={})
    table_name        = options.fetch(:table_name, "importer_#{rand(999)}")
    latitude_column   = options.fetch(:latitude_column, :lat)
    longitude_column  = options.fetch(:longitude_column, :lon)

    db.drop_table?(table_name)
    db.create_table?(table_name) do
      String    :name
      String    :description
      String    latitude_column.to_sym
      String    longitude_column.to_sym
    end

    table_name
  end

  def random_record
    {
      name:         'bogus',
      description:  'bogus',
      lat:          rand(90),
      lon:          rand(180)
    }
  end #random_record
end # Importer2::Georeferencer


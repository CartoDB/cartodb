# encoding: utf-8
require_relative '../../lib/importer/georeferencer'
require_relative '../factories/pg_connection'
require_relative '../../../../services/importer/spec/doubles/log'
require_relative '../../../../spec/rspec_configuration'

include CartoDB

include CartoDB::Importer2

describe Importer2::Georeferencer do
  before(:all) do
    @db = Importer2::Factories::PGConnection.new(
      :create_db => 'georeferencer_spec'
    ).connection

    create_schema(@db, 'cdb_importer')

    @db.execute('SET search_path TO cdb_importer,public')

    @table_name = create_table(@db)
  end

  after(:all) do
    puts "Dropping table..."
    @db.drop_table? @table_name

    #TODO Drop schema

    @db.disconnect
  end

  before(:each) do
    CartoDB::Stats::Aggregator.stubs(:read_config).returns({})
  end

  describe '#initialize' do
    it 'requires a db connection and a table name' do
      expect {
        Importer2::Georeferencer.new
      }.to raise_error(ArgumentError)

      expect {
        Importer2::Georeferencer.new(Object.new)
      }.to raise_error(ArgumentError)

      georeferencer_instance(Object.new, 'bogus')
    end
  end #initialize

  describe '#run' do
    it 'returns self if no lat / lon columns in the table' do
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

      georeferencer = georeferencer_instance
      georeferencer.run.should eq georeferencer

      dataset.to_a.first.keys.include?(:the_geom).should eq false
    end
  end #run

  describe '#create_the_geom_in' do
    before do
      @table_name = create_table(@db)
    end

    it 'adds a the_geom column to a table' do
      georeferencer = georeferencer_instance

      georeferencer.column_exists_in?(@table_name, 'the_geom').should eq false
      georeferencer.create_the_geom_in(@table_name)
      georeferencer.column_exists_in?(@table_name, 'the_geom').should eq true
    end

    it 'returns false if the_geom column already exists' do
      georeferencer = georeferencer_instance

      georeferencer.column_exists_in?(@table_name, 'the_geom').should eq false
      georeferencer.create_the_geom_in(@table_name)
      georeferencer.create_the_geom_in(@table_name).should eq false
    end
  end #create_the_geom_in

  describe '#column_exists_in?' do
    it 'return true if the column exists in the table' do
      georeferencer = georeferencer_instance
      georeferencer.column_exists_in?(@table_name, 'non_existent')
        .should eq false
      georeferencer.column_exists_in?(@table_name, 'name')
        .should eq true
    end
  end #column_exists_in?

  describe '#columns_in' do
    it 'returns the names of columns in a table' do
      georeferencer = georeferencer_instance
      georeferencer.columns_in(@table_name).should include :name
      georeferencer.columns_in(@table_name).should include :description
      georeferencer.columns_in(@table_name).should include :lat
      georeferencer.columns_in(@table_name).should include :lon
    end
  end #columns_in

  describe '#find_column_in' do
    it 'returns the name of a column in a set of possible names if one of them
    actually exists in the table' do
      georeferencer = georeferencer_instance
      georeferencer.find_column_in(@table_name, "'name','bogus'")
        .should eq 'name'

      georeferencer.find_column_in(@table_name, "'bogus'").should eq false
    end
  end #find_column_in

  def georeferencer_instance(db = @db, table_name = @table_name)
    options = { guessing: {enabled: false} }
    Importer2::Georeferencer.new(@db, table_name, options, Importer2::Georeferencer::DEFAULT_SCHEMA, job=nil, geometry_columns=nil, logger=CartoDB::Importer2::Doubles::Log.new)
  end

  # Attempts to create a new database schema
  # Does not raise exception if the schema already exists
  def create_schema(db, schema)
    db.run(%Q{CREATE SCHEMA IF NOT EXISTS #{schema}})
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
      String    :ogc_fid
    end

    table_name
  end

  def random_record
    {
      name:         'bogus',
      description:  'bogus',
      lat:          rand(90),
      lon:          rand(180),
      ogc_fid:      rand(100)
    }
  end #random_record
end # Importer2::Georeferencer

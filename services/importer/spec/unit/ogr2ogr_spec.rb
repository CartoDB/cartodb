require 'pg'
require 'sequel'
require_relative '../../../../spec/spec_helper'
require_relative '../../lib/importer/ogr2ogr'
require_relative '../doubles/job'
require_relative '../factories/csv'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe Ogr2ogr do
  before(:all) do
    @user             = create_user
    @user.save
    @pg_options       = @user.db_service.db_configuration_for.with_indifferent_access
    @db               = @user.in_database
    @db.execute('CREATE SCHEMA IF NOT EXISTS cdb_importer')
    @db.execute('SET search_path TO cdb_importer,public')
  end

  before(:each) do
    @csv              = Factories::CSV.new.write
    @filepath         = @csv.filepath
    @table_name       = "importer_#{rand(99999)}"
    @full_table_name  = "cdb_importer.#{@table_name}"
    @dataset          = @db[@table_name.to_sym]
    @wrapper          = CartoDB::Importer2::Ogr2ogr.new(@table_name, @filepath, @pg_options)
  end

  after(:each) do
    @csv.delete
    @db.drop_table? @full_table_name
  end

  after(:all) do
    @db.execute('DROP SCHEMA cdb_importer cascade')
    @db.disconnect
    @user.destroy
  end

  describe '#initialize' do
    it 'requires a filepath and postgres options' do
      expect{
        CartoDB::Importer2::Ogr2ogr.new
      }.to raise_error ArgumentError
      expect{
        CartoDB::Importer2::Ogr2ogr.new('bogus.txt')
      }.to raise_error ArgumentError
    end
  end

  describe '#command' do
    it 'includes an encoding' do
      @wrapper.environment.should include 'PGCLIENTENCODING'
    end

    it 'includes the postgres options passed at initialization time' do
      @wrapper.command.any? { |c| c.include?(@pg_options.fetch(:host)) }.should be_true
      @wrapper.command.any? { |c| c.include?(@pg_options.fetch(:port).to_s) }.should be_true
      @wrapper.command.any? { |c| c.include?(@pg_options.fetch(:username)) }.should be_true
      @wrapper.command.any? { |c| c.include?(@pg_options.fetch(:database)) }.should be_true
    end

    it 'includes the desired output table name' do
      @wrapper.command.should include @full_table_name
    end

    it 'includes the filepath to process' do
      @wrapper.command.should include @filepath
    end
  end

  describe '#executable_path' do
    it 'returns the path to the ogr2ogr binary' do
      (@wrapper.executable_path =~ /ogr2ogr/).should_not be nil
    end
  end

  describe '#run' do
    it 'imports a CSV to a Postgres table' do
      @wrapper.run
      records = @dataset.to_a

      records.length.should eq 10
      records.first.keys.include?(:header_1).should eq true
      records.first.keys.include?(:header_2).should eq true
    end

    it 'keeps an existing cartodb_id column in imported records' do
      header = ["cartodb_id", "header_2"]
      data   = ["5", "cell_#{rand(999)}"]
      csv    = Factories::CSV.new.write(header, data)

      @wrapper = CartoDB::Importer2::Ogr2ogr.new(@table_name, csv.filepath, @pg_options)
      @wrapper.run

      record    = @dataset.first
      record.fetch(:cartodb_id).should eq '5'
    end

    it 'Does not create header if one column is numerical' do
      header = ["id", "2"]
      data   = ["5", "cell_#{rand(999)}"]
      csv    = Factories::CSV.new.write(header, data)

      @wrapper = CartoDB::Importer2::Ogr2ogr.new(@table_name, csv.filepath, @pg_options)
      @wrapper.run

      record    = @dataset.first
      record.fetch(:field_1).should eq 'id'
    end

  end

  describe '#command_output' do
    it 'returns stdout and stderr from ogr2ogr binary' do
      wrapper = CartoDB::Importer2::Ogr2ogr.new(@table_name, 'non_existent', @pg_options)
      wrapper.run
      wrapper.command_output.should_not eq ''

      wrapper = CartoDB::Importer2::Ogr2ogr.new(@table_name, @filepath, @pg_options)
      wrapper.run
      wrapper.command_output.should eq ''
    end
  end

  describe '#exit_code' do
    it 'returns the exit code from the ogr2ogr binary' do
      wrapper = CartoDB::Importer2::Ogr2ogr.new(@table_name, 'non_existent', @pg_options)
      wrapper.run
      wrapper.exit_code.should_not eq 0

      wrapper = CartoDB::Importer2::Ogr2ogr.new(@table_name, @filepath, @pg_options)
      wrapper.run
      wrapper.exit_code.should eq 0
    end
  end

  describe '#append_mode' do
    it "tests that ogr2ogr's append mode works as expected" do
      header = ["cartodb_id", "header_2"]
      data_1   = ["1", "cell_#{rand(999)}"]
      data_2   = ["2", "cell_#{rand(999)}"]

      csv_1 = Factories::CSV.new(name=nil, how_many_duplicates=0)
        .write(header, data_1)

      csv_2 = Factories::CSV.new(name=nil, how_many_duplicates=0)
        .write(header, data_2)

      ogr2ogr = CartoDB::Importer2::Ogr2ogr.new(@table_name, csv_1.filepath, @pg_options)
      ogr2ogr.run

      ogr2ogr.filepath = csv_2.filepath
      ogr2ogr.run(append_mode=true)

      @dataset.all[0].fetch(:cartodb_id).should eq '1'
      @dataset.all[1].fetch(:cartodb_id).should eq '2'
      @dataset.all.count.should eq 2
    end
  end

end

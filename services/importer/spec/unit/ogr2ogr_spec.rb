# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'pg'
require 'sequel'
require_relative '../../ogr2ogr'
require_relative '../doubles/job'
require_relative '../factories/csv'
require_relative '../factories/pg_connection'

include CartoDB

describe Importer::Ogr2ogr do
  before do
    @csv          = Importer::Factories::CSV.new.write
    @filepath     = @csv.filepath
    @pg_options   = Importer::Factories::PGConnection.new.pg_options
    @table_name   = "importer_#{rand(999)}"
    @db           = Importer::Factories::PGConnection.new.connection
    @wrapper      = Importer::Ogr2ogr.new(@filepath, @pg_options, @table_name)
  end

  after do
    @csv.delete
    @db.drop_table? @wrapper.table_name
  end

  describe '#initialize' do
    it 'requires a filepath and postgres options' do
      lambda { Importer::Ogr2ogr.new }.must_raise ArgumentError
      lambda { Importer::Ogr2ogr.new('bogus.txt') }.must_raise ArgumentError
    end
  end #initialize

  describe '#command' do
    it 'includes an encoding' do
      @wrapper.command.must_match /PGCLIENTENCODING/
    end

    it 'includes the postgres options passed at initialization time' do
      @wrapper.command.must_match /#{@pg_options.fetch(:host)}/
      @wrapper.command.must_match /#{@pg_options.fetch(:port)}/
      @wrapper.command.must_match /#{@pg_options.fetch(:user)}/
      @wrapper.command.must_match /#{@pg_options.fetch(:database)}/
    end

    it 'includes the desired output table name' do
      @wrapper.command.must_match /#{@wrapper.table_name}/
    end

    it 'includes the filepath to process' do
      @wrapper.command.must_match /#{@filepath}/
    end
  end #command

  describe '#executable_path' do
    it 'returns the path to the ogr2ogr binary' do
      @wrapper.executable_path.must_match /ogr2ogr/
    end
  end #executable_path 

  describe '#run' do
    it 'imports a CSV to a Postgres table' do
      @wrapper.run
      records   = @db[@wrapper.table_name.to_sym].to_a

      records.length      .must_equal 10
      records.first.keys  .must_include :header_1
      records.first.keys  .must_include :header_2
    end

    it 'adds a cartodb_id column to imported records' do
      @wrapper.run
      record    = @db[@wrapper.table_name.to_sym].first
      record.keys.must_include :cartodb_id
    end
  end #run

  describe '#command_output' do
    it 'returns stdout and stderr from ogr2ogr binary' do
      wrapper   = Importer::Ogr2ogr.new('non_existent', @pg_options, @table_name)
      wrapper.run
      wrapper.command_output.wont_be_empty

      wrapper   = Importer::Ogr2ogr.new(@filepath, @pg_options, @table_name)
      wrapper.run
      wrapper.command_output.must_be_empty
    end
  end #command_output

  describe '#exit_code' do
    it 'returns the exit code from the ogr2ogr binary' do
      wrapper   = Importer::Ogr2ogr.new('non_existent', @pg_options, @table_name)
      wrapper.run
      wrapper.exit_code.wont_equal 0

      wrapper   = Importer::Ogr2ogr.new(@filepath, @pg_options, @table_name)
      wrapper.run
      wrapper.exit_code.must_equal 0
    end
  end #exit_code
end # Importer::Ogr2ogr


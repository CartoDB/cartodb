# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'pg'
require 'sequel'
require_relative '../../lib/importer/ogr2ogr'
require_relative '../doubles/job'
require_relative '../factories/csv'
require_relative '../factories/pg_connection'

include CartoDB::Importer

describe Ogr2ogr do
  before do
    @csv          = Factories::CSV.new.write
    @filepath     = @csv.filepath
    @pg_options   = Factories::PGConnection.new.pg_options
    @table_name   = "importer_#{rand(999)}"
    @db           = Factories::PGConnection.new.connection
    @wrapper      = Ogr2ogr.new(@table_name, @filepath, @pg_options)
  end

  after do
    @csv.delete
    @db.drop_table? @wrapper.table_name
  end

  describe '#initialize' do
    it 'requires a filepath and postgres options' do
      lambda { Ogr2ogr.new }.must_raise ArgumentError
      lambda { Ogr2ogr.new('bogus.txt') }.must_raise ArgumentError
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

    it 'keeps an existing cartodb_id column in imported records' do
      skip
      header    = ["cartodb_id", "header_2"]
      data      = ["5", "cell_#{rand(999)}"]
      csv       = Factories::CSV.new.write(header, data)

      @wrapper  = Ogr2ogr.new(
        csv.filepath, @pg_options, @table_name, preserve_cartodb_id: true
      )
      @wrapper.run

      record    = @db[@wrapper.table_name.to_sym].first
      record.fetch(:cartodb_id).must_equal 5
    end
  end #run

  describe '#command_output' do
    it 'returns stdout and stderr from ogr2ogr binary' do
      wrapper   = Ogr2ogr.new(@table_name, 'non_existent', @pg_options)
      wrapper.run
      wrapper.command_output.wont_be_empty

      wrapper   = Ogr2ogr.new(@table_name, @filepath, @pg_options)
      wrapper.run
      wrapper.command_output.must_be_empty
    end
  end #command_output

  describe '#exit_code' do
    it 'returns the exit code from the ogr2ogr binary' do
      wrapper   = Ogr2ogr.new(@table_name, 'non_existent', @pg_options)
      wrapper.run
      wrapper.exit_code.wont_equal 0

      wrapper   = Ogr2ogr.new(@table_name, @filepath, @pg_options)
      wrapper.run
      wrapper.exit_code.must_equal 0
    end
  end #exit_code
end # Ogr2ogr


# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require 'pg'
require 'sequel'
require_relative '../../lib/importer/ogr2ogr'
require_relative '../doubles/job'
require_relative '../factories/csv'
require_relative '../factories/pg_connection'

include CartoDB::Importer2

describe Ogr2ogr do
  before do
    @csv              = Factories::CSV.new.write
    @filepath         = @csv.filepath
    @pg_options       = Factories::PGConnection.new.pg_options
    @table_name       = "importer_#{rand(99999)}"
    @db               = Factories::PGConnection.new.connection
    @full_table_name  = "cdb_importer.#{@table_name}"
    @dataset          = @db[@full_table_name.to_sym]
    @wrapper          = Ogr2ogr.new(@full_table_name, @filepath, @pg_options)

    @db.execute('SET search_path TO cdb_importer,public')
  end

  after do
    @csv.delete
    @db.drop_table? @full_table_name
    @db.disconnect
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
      @wrapper.command.must_match /#{@full_table_name}/
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
      records   = @dataset.to_a

      records.length      .must_equal 10
      records.first.keys  .must_include :header_1
      records.first.keys  .must_include :header_2
    end

    it 'keeps an existing cartodb_id column in imported records' do
      header    = ["cartodb_id", "header_2"]
      data      = ["5", "cell_#{rand(999)}"]
      csv       = Factories::CSV.new.write(header, data)

      @wrapper  = Ogr2ogr.new(@full_table_name, csv.filepath, @pg_options)
      @wrapper.run

      record    = @dataset.first
      record.fetch(:cartodb_id).must_equal '5'
    end
  end #run

  describe '#command_output' do
    it 'returns stdout and stderr from ogr2ogr binary' do
      wrapper   = Ogr2ogr.new(@full_table_name, 'non_existent', @pg_options)
      wrapper.run
      wrapper.command_output.wont_be_empty

      wrapper   = Ogr2ogr.new(@full_table_name, @filepath, @pg_options)
      wrapper.run
      wrapper.command_output.must_be_empty
    end
  end #command_output

  describe '#exit_code' do
    it 'returns the exit code from the ogr2ogr binary' do
      wrapper   = Ogr2ogr.new(@full_table_name, 'non_existent', @pg_options)
      wrapper.run
      wrapper.exit_code.wont_equal 0

      wrapper   = Ogr2ogr.new(@full_table_name, @filepath, @pg_options)
      wrapper.run
      wrapper.exit_code.must_equal 0
    end
  end #exit_code
end # Ogr2ogr


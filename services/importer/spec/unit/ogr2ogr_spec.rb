# encoding: utf-8
require 'minitest/autorun'
require 'csv'
require 'pg'
require 'sequel'
require_relative '../../ogr2ogr'

include CartoDB

describe Importer::Ogr2ogr do
  before do
    @job_id        = rand(999)
    @filepath      = csv_factory
    @pg_options    = pg_options_factory

    @wrapper = Importer::Ogr2ogr.new(@filepath, @pg_options, @job_id)
  end

  after do
    File.delete(@filepath)
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
      @wrapper.command.must_match /#{@wrapper.output_name}/
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

  describe '#output_name' do
    it 'is based on the name of the input file' do
      name = File.basename(@filepath).split('.').first
      @wrapper.output_name.must_match /#{name}/
    end

    it 'uses the prefix if passed at initialization time' do
      @wrapper.output_name.must_match /#{@job_id}/
    end

    it 'is sanitized' do
      wrapper   = Importer::Ogr2ogr.new('foo.bar', @pg_options)
      #wrapper.output_name.must_match /foo_bar/
      
      wrapper   = Importer::Ogr2ogr.new('FOO_BAR', @pg_options)
      wrapper.output_name.must_match /foo_bar/
    end
  end #output_name

  describe '#run' do
    it 'imports a CSV to a Postgres table' do
      wrapper   = Importer::Ogr2ogr.new(@filepath, @pg_options)
      db        = Sequel.postgres(@pg_options)

      wrapper.run
      records   = db[wrapper.output_name.to_sym].to_a

      records.length      .must_equal 10
      records.first.keys  .must_include :header_1
      records.first.keys  .must_include :header_2
    end

    it 'adds a cartodb_id column to imported records' do
      wrapper   = Importer::Ogr2ogr.new(@filepath, @pg_options)
      db        = Sequel.postgres(@pg_options)

      wrapper.run
      record    = db[wrapper.output_name.to_sym].first
      record.keys.must_include :cartodb_id
    end
  end #run

  def csv_factory(name=nil)
    name      ||= "importer#{rand(999)}"
    filepath  = "/var/tmp/#{name}.csv"

    CSV.open(filepath, "wb") do |csv|
      csv << ["header_1", "header_2"]
      10.times { csv << ["cell_#{rand(999)}", "cell_#{rand(999)}"] }
    end
    
    filepath
  end #csv_factory

  def pg_options_factory
    pg_options  = {
      host:     'localhost',
      port:     5432,
      user:     'lorenzo',
      password: nil,
      database: 'test'
    }
  end #pg_options_factory
end # Importer::Ogr2ogr


# encoding: utf-8
gem 'minitest'
require 'minitest/autorun'
require_relative '../../lib/importer/psql'
require_relative '../factories/pg_connection'

describe 'SQL linter' do
  include CartoDB::Importer2

  describe '#create_table_statement' do
    it 'returns a create table statement with the passed table name' do
      table_name  = 'foo'
      filepath    = File.expand_path('../../fixtures/csv_with_lat_lon.sql', __FILE__)
      stream      = File.open(filepath)
      pg_options  = {}

      psql = Psql.new(table_name, filepath, pg_options)
      psql.create_table_statement(File.open(filepath))
        .must_match /#{table_name}/
    end
  end

  describe '#copy_satement' do
    it 'returns a copy statement with the passed table name' do
      table_name  = 'foo'
      filepath    = File.expand_path('../../fixtures/csv_with_lat_lon.sql', __FILE__)
      stream      = File.open(filepath)
      pg_options  = {}

      psql = Psql.new(table_name, filepath, pg_options)
      psql.copy_statement(File.open(filepath))
        .must_match /#{table_name}/
    end
  end

  describe '#run' do
    it 'runs' do
      table_name    = 'importer_' + Time.now.to_f.to_s
      filepath      = File.expand_path('../../fixtures/csv_with_lat_lon.sql', __FILE__)
      stream        = File.open(filepath)
      pg_connection =  Factories::PGConnection.new

      psql = Psql.new(table_name, filepath, pg_connection.pg_options)
      psql.run

      pg_connection.connection[%Q(
        SELECT * FROM "cdb_importer"."#{table_name}"
      )].to_a.wont_be_empty
    end
  end
end


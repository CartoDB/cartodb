require_relative '../../lib/importer/psql'
require_relative '../factories/pg_connection'
require_relative '../../../../services/importer/spec/acceptance/cdb_importer_context'

describe 'SQL linter' do
  include CartoDB::Importer2
  include_context 'cdb_importer schema'

  describe '#create_table_statement' do
    it 'returns a create table statement with the passed table name' do
      table_name  = 'foo'
      filepath    = File.expand_path('../../fixtures/csv_with_lat_lon.sql', __FILE__)
      stream      = File.open(filepath)
      pg_options  = {}

      psql = CartoDB::Importer2::Psql.new(table_name, filepath, pg_options)
      psql.create_table_statement(File.open(filepath))
        .should match /#{table_name}/
    end
  end

  describe '#copy_satement' do
    it 'returns a copy statement with the passed table name' do
      table_name  = 'foo'
      filepath    = File.expand_path('../../fixtures/csv_with_lat_lon.sql', __FILE__)
      stream      = File.open(filepath)
      pg_options  = {}

      psql = CartoDB::Importer2::Psql.new(table_name, filepath, pg_options)
      psql.copy_statement(File.open(filepath))
        .should match /#{table_name}/
    end
  end

  describe '#run' do
    it 'runs' do
      table_name    = 'importer_' + Time.now.to_f.to_s
      filepath      = File.expand_path('../../fixtures/csv_with_lat_lon.sql', __FILE__)
      stream        = File.open(filepath)
      pg_connection =  CartoDB::Importer2::Factories::PGConnection.new

      psql = CartoDB::Importer2::Psql.new(table_name, filepath, pg_connection.pg_options)
      psql.run

      pg_connection.connection[%Q(
        SELECT * FROM "cdb_importer"."#{table_name}"
      )].to_a.should_not be_empty
    end
  end
end


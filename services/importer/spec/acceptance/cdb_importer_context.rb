require_relative '../factories/pg_connection'

shared_context "cdb_importer schema" do

  before(:all) do
    pg_connection = CartoDB::Importer2::Factories::PGConnection.new
    @db = pg_connection.connection
    @pg_options  = pg_connection.pg_options
    @db.execute('CREATE SCHEMA IF NOT EXISTS cdb_importer')
    @db.execute('CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA public')
    @db.execute('CREATE EXTENSION IF NOT EXISTS postgis_topology')
    @db.execute('GRANT ALL ON spatial_ref_sys TO PUBLIC')
  end

  after(:all) do
    @db.execute('DROP SCHEMA cdb_importer CASCADE')
    @db.disconnect
  end

end



shared_context "cdb_importer schema" do

  before do
    pg_connection = Factories::PGConnection.new
    @db = pg_connection.connection
    @pg_options  = pg_connection.pg_options
    @db.execute('CREATE SCHEMA IF NOT EXISTS cdb_importer')
  end

  after(:each) do
    @db.execute('DROP SCHEMA cdb_importer CASCADE')
    @db.disconnect
  end

end
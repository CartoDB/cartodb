

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


  def geometry_type_for(runner)
    result      = runner.results.first
    table_name  = result.tables.first
    schema      = result.schema

    runner.db[%Q{
      SELECT public.GeometryType(the_geom)
      FROM "#{schema}"."#{table_name}"
    }].first.fetch(:geometrytype)
  end #geometry_type_for

end
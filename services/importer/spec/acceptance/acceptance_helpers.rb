module AcceptanceHelpers

  def geometry_type_for(runner, user)
    result      = runner.results.first
    table_name  = result.tables.first
    schema      = result.schema

    user.in_database[%Q{
      SELECT public.GeometryType(the_geom)
      FROM "#{schema}"."#{table_name}"
    }].first.fetch(:geometrytype)
  end

  def path_to(filepath)
    File.join(File.dirname(__FILE__), "../fixtures/#{filepath}")
  end

  def logger_double
    CartoDB::Importer2::Doubles::Log.new
  end

end

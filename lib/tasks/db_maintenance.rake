namespace :cartodb do
  namespace :db do
    desc "Add the_geom_webmercator column to every table which needs it"
    task :add_the_geom_webmercator => :environment do
      User.all.each do |user|
        tables = Table.filter(:user_id => user.id).all
        next if tables.empty?
        puts "Updating tables from #{user.username}"
        tables.each do |table|
          has_the_geom = false
          user.in_database do |user_database|
            flatten_schema = user_database.schema(table.name.to_sym).flatten
            if flatten_schema.include?(:the_geom) && !flatten_schema.include?(Table::THE_GEOM_WEBMERCATOR.to_sym)
              puts "Updating table #{table.name}"
              has_the_geom = true
              geometry_type = user_database["select GeometryType(the_geom) FROM #{table.name} limit 1"].first.try(:geometrytype) || "point"
              user_database.run("SELECT AddGeometryColumn ('#{table.name}','#{Table::THE_GEOM_WEBMERCATOR}',#{CartoDB::GOOGLE_SRID},'#{geometrytype}',2)")
              user_database.run("CREATE INDEX #{table.name}_#{Table::THE_GEOM_WEBMERCATOR}_idx ON #{table.name} USING GIST(#{Table::THE_GEOM_WEBMERCATOR})")                      
              user_database.run("VACUUM ANALYZE #{table.name}")
              table.update_stored_schema(user_database)
              table.save_changes
            end
          end
          if has_the_geom
            owner.in_database(:as => :superuser) do |user_database|
              user_database.run(<<-TRIGGER     
                DROP TRIGGER IF EXISTS update_the_geom_webmercator_trigger ON #{table.name};  
                CREATE OR REPLACE FUNCTION update_the_geom_webmercator() RETURNS trigger AS $update_the_geom_webmercator_trigger$
                  BEGIN
                       NEW.#{Table::THE_GEOM_WEBMERCATOR} := ST_Transform(NEW.the_geom,#{CartoDB::GOOGLE_SRID});
                       RETURN NEW;
                  END;
                $update_the_geom_webmercator_trigger$ LANGUAGE plpgsql VOLATILE COST 100;

                CREATE TRIGGER update_the_geom_webmercator_trigger 
                BEFORE INSERT OR UPDATE OF the_geom ON #{table.name} 
                  FOR EACH ROW EXECUTE PROCEDURE update_the_geom_webmercator();    
        TRIGGER
              )
            end
          end
        end
      end
    end
  end
end
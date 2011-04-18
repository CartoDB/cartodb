# coding: UTF-8

module CartoDB
  class SqlParser
    def self.update_schema
      @@update_schema
    end

    def self.pre_parsing(query, user_id)
      @@update_schema = nil
      query.split(';').map do |raw_query|
        next if raw_query.blank?
        q = raw_query.downcase.strip
        raise CartoDB::QueryNotAllowed if q =~ /^create/i
        if q.include?('drop') && q =~ /^\s*drop\s*table\s*[if\s*exists]?([\w_]+)/i
          if t = Table[:user_id => user_id, :name => $1]
            t.destroy
          else
            raise CartoDB::TableNotExists
          end
          nil
        elsif q.include?('rename to') && q =~ /^alter\s*table\s*([\w_]+)\s*rename\s*to\s*([\w_]+)/i
          if t = Table[:user_id => user_id, :name => $1]
            t.name = $2
            t.save_changes
          else
            raise CartoDB::TableNotExists
          end
          nil
        elsif q.include?('rename') && q =~ /^\s*alter\s*table\s*([\w_]+)\s*/i
          @@update_schema = $1
          raw_query
        else
          raw_query
        end
      end.compact.join(';')
    end
    def self.parse(query, database_name = nil)
      if query.include?('distance')
        query.gsub!(/distance\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^\)]+)\s*\)/i) do |matches|
          "st_distance_sphere(#{$1},ST_SetSRID(ST_Point(#{$2},#{$3}),#{CartoDB::SRID}))"
        end
      end
      if query.include?('latitude')
        query.gsub!(/latitude\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_Y(#{$1})"
        end
      end
      if query.include?('longitude')
        query.gsub!(/longitude\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_X(#{$1})"
        end
      end
      if query.include?('geojson')
        query.gsub!(/geojson\((.*)\s*\)\s+/i) do |matches|
          "ST_AsGeoJSON(#{$1},6) "
        end
      end
      if query.include?('kml')
        query.gsub!(/kml\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_AsKML(#{$1},6)"
        end
      end
      if query.include?('svg')
        query.gsub!(/svg\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_AsSVG(#{$1},0,6)"
        end
      end
      if query.include?('wkt')
        query.gsub!(/wkt\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_AsText(#{$1})"
        end
      end
      if query.include?('geohash')
        query.gsub!(/geohash\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_GeoHash(#{$1},6)"
        end
      end
      if query.include?('intersects')
        query.gsub!(/intersects\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^\)]+)\s*\)/i) do |matches|
          "ST_Intersects(ST_SetSRID(ST_Point(#{$1},#{$2}),#{CartoDB::SRID}),#{$3})"
        end
      end
      if query.include?('the_geom')
        query.gsub!(/^select([^\(]+\s*)(the_geom)(\s*[^\(]+)from/i) do |matches|
          "select #{$1.strip}ST_AsGeoJSON(the_geom) as the_geom#{$3.strip} from"
        end
      end
      if query.include?('*') && !database_name.blank?
        if query =~ /^\s*select\s*(\*)\s*from\s*(\w+)\s*(.*)/i
          query.gsub!(/^\s*select\s*(\*)\s*from\s*(\w+)\s*(.*)/i) do |matches|
            stored_schema = $tables_metadata.hget "rails:#{database_name}:#{$2}", "columns"
            raise CartoDB::TableNotExists if stored_schema.blank?
            schema = JSON.parse(stored_schema)
            raise "Blank columns in table #{database_name}:#{$2}" if schema.blank?
            if schema.include?("the_geom")
              schema[schema.index("the_geom")] = "ST_AsGeoJSON(the_geom) as the_geom"
            end
            "select #{schema.join(',')} from #{$2} #{$3}".strip
          end
        else
          query.gsub!(/(\w+\.\*)/i) do |match|
            table,columns = match.split('.')
            schema = $tables_metadata.hget("rails:#{database_name}:#{table}", "columns")
            unless schema.blank?
              schema = JSON.parse(schema) 
            end
            if schema.blank?
              "#{$1}"
            else
              schema.map do |c|
                if c != "the_geom"
                  "#{table}.#{c}"
                else
                  "ST_AsGeoJSON(#{table}.the_geom) as the_geom"
                end
              end.join(',')
            end
          end
        end
      end
      query
    end
  end
end

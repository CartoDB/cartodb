# coding: UTF-8

module CartoDB
  class SqlParser
    def self.parse(query)
      if query.include?('distance')
        query.gsub!(/distance\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^\)]+)\s*\)/i) do |matches|
          "st_distance_sphere(ST_Transform(#{$1},#{CartoDB::SRID}),ST_SetSRID(ST_Point(#{$2},#{$3}),#{CartoDB::SRID}))"
        end
      end
      if query.include?('latitude')
        query.gsub!(/latitude\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_Y(ST_Transform(#{$1},#{CartoDB::SRID}))"
        end        
      end
      if query.include?('longitude')
        query.gsub!(/longitude\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_X(ST_Transform(#{$1},#{CartoDB::SRID}))"
        end        
      end
      if query.include?('geojson')
        query.gsub!(/geojson\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_AsGeoJSON(ST_Transform(#{$1},#{CartoDB::SRID}))"
        end        
      end
      if query.include?('kml')
        query.gsub!(/kml\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_AsKML(ST_Transform(#{$1},#{CartoDB::SRID}),6)"
        end        
      end
      if query.include?('svg')
        query.gsub!(/svg\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_AsSVG(ST_Transform(#{$1},#{CartoDB::SRID}),6)"
        end        
      end
      if query.include?('wkt')
        query.gsub!(/wkt\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_AsText(ST_Transform(#{$1},#{CartoDB::SRID}),6)"
        end        
      end      
      if query.include?('geohash')
        query.gsub!(/geohash\(\s*([^\)]+)\s*\)/i) do |matches|
          "ST_GeoHash(ST_Transform(#{$1},#{CartoDB::SRID}),6)"
        end        
      end
      if query.include?('intersects')
        query.gsub!(/intersects\(\s*([^,]+)\s*,\s*([^,]+)\s*,\s*([^\)]+)\s*\)/i) do |matches|
          "ST_Intersects(ST_SetSRID(ST_Point(#{$1},#{$2}),#{CartoDB::SRID}),#{$3})"
        end        
      end
      query
    end
  end
end
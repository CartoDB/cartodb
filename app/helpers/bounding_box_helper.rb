# encoding: utf-8

module BoundingBoxHelper

  DEFAULT_BOUNDS = {
    minlon: -179,
    maxlon: 179,
    minlat: -85.0511,
    maxlat: 85.0511
  }

  def self.update_visualizations_bbox(table)
    begin
      db = table.owner.in_database
      table.update_table_geom_pg_stats
      bounds = BoundingBoxHelper.calculate_bounding_box(db, table.qualified_table_name)
      save_bounding_box(bounds, "visualizations", "bbox", table.table_visualization.id)
    rescue => exception
      CartoDB.notify_exception(exception)
    end
  end

  def self.calculate_bounding_box(db,table_name)
    get_table_bounds(db,table_name)
  rescue Sequel::DatabaseError => exception
    CartoDB.notify_exception(exception, { table: table_name })
    raise BoundingBoxError.new("Can't calculate the bounding box for table #{table_name}. ERROR: #{exception}")
  end

  def self.get_table_bounds(db,table_name)
    # (lon,lat) as comes out from postgis
    result = current_bbox_using_stats(db, table_name)
    {
      maxx: bound_for(result[:max][0].to_f, :minlon, :maxlon),
      maxy: bound_for(result[:max][1].to_f, :minlat, :maxlat),
      minx: bound_for(result[:min][0].to_f, :minlon, :maxlon),
      miny: bound_for(result[:min][1].to_f, :minlat, :maxlat)
    }
  end
  
  # Postgis stats-based calculation of bounds. Much faster but not always present, so needs a fallback
  def self.current_bbox_using_stats(db,table_name)
    # (lon,lat) as comes from postgis
    ::JSON.parse(db.fetch(%Q{
      SELECT _postgis_stats ('#{table_name}', 'the_geom');
    }).first[:_postgis_stats])['extent'].symbolize_keys
  rescue => e
    if e.message =~ /stats for (.*) do not exist/i
      begin
        current_bbox(db, table_name)
      rescue
        default_bbox
      end
    else
      default_bbox
    end
  end

  def self.current_bbox(db,table_name)
    # (lon, lat) as comes from postgis (ST_X = Longitude, ST_Y = Latitude)
    # map has no geometries
    result = get_bbox_values(db, table_name, "the_geom")
    if result.reject { |key,value| value.nil? }.length == 0
      default_bbox
    else
      # still (lon,lat) to be consistent with current_map_bounds_using_stats()
      {
        max: [result[:maxx].to_f, result[:maxy].to_f],
        min: [result[:minx].to_f, result[:miny].to_f]
      }
    end
  rescue Sequel::DatabaseError => exception
    CartoDB.notify_exception(exception, { table: table_name })
    raise BoundingBoxError.new("Can't calculate the bounding box for table #{table_name}. ERROR: #{exception}")
  end

  def self.bound_for(value, minimum, maximum)
    [[value, DEFAULT_BOUNDS.fetch(minimum)].max, DEFAULT_BOUNDS.fetch(maximum)].min
  end

  def self.default_bbox
    # (lon, lat) to be consistent with postgis queries
    {
      max: [ DEFAULT_BOUNDS[:maxlon], DEFAULT_BOUNDS[:maxlat] ],
      min: [ DEFAULT_BOUNDS[:minlon], DEFAULT_BOUNDS[:minlat] ]
    }
  end

  def self.get_bbox_values(db, table_name, column_name)

    result = db.fetch(%Q{
      SELECT
        ST_XMin(ST_Extent(#{column_name})) AS minx,
        ST_YMin(ST_Extent(#{column_name})) AS miny,
        ST_XMax(ST_Extent(#{column_name})) AS maxx,
        ST_YMax(ST_Extent(#{column_name})) AS maxy
      FROM #{table_name} AS subq
    }).first

    result
  end

  def self.to_polygon(minx, miny, maxx, maxy)
    "ST_Transform(ST_Envelope('SRID=4326;POLYGON((#{minx} #{miny}, #{minx} #{maxy}, #{maxx} #{maxy}, #{maxx} #{miny}, #{minx} #{miny}))'::geometry), 3857)"
  end

  private

  def self.save_bounding_box(bounds, table_name, column_name, id)
    update_sql = "UPDATE #{table_name} SET #{column_name} = ST_Transform(ST_Envelope('SRID=4326;POLYGON((" \
                 "#{bounds[:minx]} #{bounds[:miny]},#{bounds[:minx]} #{bounds[:maxy]}," \
                 "#{bounds[:maxx]} #{bounds[:maxy]},#{bounds[:maxx]} #{bounds[:miny]}," \
                 "#{bounds[:minx]} #{bounds[:miny]}))'::geometry), 3857) WHERE id = '#{id}';"
    Rails::Sequel.connection.run(update_sql)
  end

end

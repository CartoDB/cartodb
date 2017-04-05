# encoding: utf-8
require_relative '../../lib/carto/table_utils'

class Carto::BoundingBoxHelper
  extend Carto::TableUtils

  DEFAULT_BOUNDS = {
    minx: -179,
    maxx: 179,
    miny: -85.0511,
    maxy: 85.0511
  }.freeze

  def get_table_bounds(db, table_name)
    # (lon,lat) as comes out from postgis
    result = current_bbox_using_stats(db, table_name)
    {
      maxx: bound_for(result[:max][0].to_f, :minx, :maxx),
      maxy: bound_for(result[:max][1].to_f, :miny, :maxy),
      minx: bound_for(result[:min][0].to_f, :minx, :maxx),
      miny: bound_for(result[:min][1].to_f, :miny, :maxy)
    } if result
  end

  private

  # Postgis stats-based calculation of bounds. Much faster but not always present, so needs a fallback
  def current_bbox_using_stats(db, table_name)
    # Less ugly (for tests at least) than letting an exception generate not having any table name
    return nil unless table_name.present?

    # (lon,lat) as comes from postgis
    JSON.parse(db.execute(%{
      SELECT _postgis_stats ('#{table_name}', 'the_geom');
    }).first['_postgis_stats'])['extent'].symbolize_keys
  rescue => e
    if e.message =~ /stats for (.*) do not exist/i
      begin
        current_bbox(db, table_name)
      rescue
        nil
      end
    else
      nil
    end
  end

  def current_bbox(db, table_name)
    # (lon, lat) as comes from postgis (ST_X = Longitude, ST_Y = Latitude)
    # map has no geometries
    result = get_bbox_values(db, table_name, "the_geom")
    if result.all? { |_, value| value.nil? }
      nil
    else
      # still (lon,lat) to be consistent with current_bbox_using_stats()
      {
        max: [result['maxx'].to_f, result['maxy'].to_f],
        min: [result['minx'].to_f, result['miny'].to_f]
      }
    end
  rescue Sequel::DatabaseError => exception
    CartoDB::Logger.error(exception: exception, table: table_name)
    raise BoundingBoxError.new("Can't calculate the bounding box for table #{table_name}. ERROR: #{exception}")
  end

  def bound_for(value, minimum, maximum)
    [[value, DEFAULT_BOUNDS.fetch(minimum)].max, DEFAULT_BOUNDS.fetch(maximum)].min
  end

  def get_bbox_values(db, table_name, column_name)
    result = db.execute(%{
      SELECT
        ST_XMin(ST_Extent(#{column_name})) AS minx,
        ST_YMin(ST_Extent(#{column_name})) AS miny,
        ST_XMax(ST_Extent(#{column_name})) AS maxx,
        ST_YMax(ST_Extent(#{column_name})) AS maxy
      FROM #{safe_table_name_quoting(table_name)} AS subq
    }).first

    result
  end

  def parse_bbox_parameters(bounding_box)
    bbox_coords = bounding_box.split(',').map { |coord| Float(coord) rescue nil }.compact
    if bbox_coords.length != 4
      raise CartoDB::BoundingBoxError.new('bounding box must have 4 coordinates: minx, miny, maxx, maxy')
    end
    { minx: bbox_coords[0], miny: bbox_coords[1], maxx: bbox_coords[2], maxy: bbox_coords[3] }
  end
end

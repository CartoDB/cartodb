# encoding: utf-8
require_relative '../../lib/carto/table_utils'
require_dependency 'carto/bounding_box_utils'

class Carto::BoundingBoxService
  extend Carto::TableUtils

  def initialize(user)
    @user = user
  end

  def get_table_bounds(table_name)
    # (lon,lat) as comes out from postgis
    result = current_bbox_using_stats(table_name)
    return nil unless result
    {
      maxx: Carto::BoundingBoxUtils.bound_for(result[:max][0].to_f, :minx, :maxx),
      maxy: Carto::BoundingBoxUtils.bound_for(result[:max][1].to_f, :miny, :maxy),
      minx: Carto::BoundingBoxUtils.bound_for(result[:min][0].to_f, :minx, :maxx),
      miny: Carto::BoundingBoxUtils.bound_for(result[:min][1].to_f, :miny, :maxy)
    }
  end

  private

  # Postgis stats-based calculation of bounds. Much faster but not always present, so needs a fallback
  def current_bbox_using_stats(table_name)
    # Less ugly (for tests at least) than letting an exception generate not having any table name
    return nil unless table_name.present?

    # (lon,lat) as comes from postgis
    JSON.parse(@user.db_service.execute_in_user_database(%{
      SELECT _postgis_stats ('#{table_name}', 'the_geom');
    }).first['_postgis_stats'])['extent'].symbolize_keys
  rescue => e
    if e.message =~ /stats for (.*) do not exist/i
      begin
        current_bbox(table_name)
      rescue
        nil
      end
    end
  end

  def current_bbox(table_name)
    # (lon, lat) as comes from postgis (ST_X = Longitude, ST_Y = Latitude)
    # map has no geometries
    result = get_bbox_values(table_name, "the_geom")
    if result.all? { |_, value| value.nil? }
      nil
    else
      # still (lon,lat) to be consistent with current_bbox_using_stats()
      {
        max: [result['maxx'].to_f, result['maxy'].to_f],
        min: [result['minx'].to_f, result['miny'].to_f]
      }
    end
  rescue PG::Error => exception
    CartoDB::Logger.error(exception: exception, table: table_name)
    raise BoundingBoxError.new("Can't calculate the bounding box for table #{table_name}. ERROR: #{exception}")
  end

  def get_bbox_values(table_name, column_name)
    result = @user.db_service.execute_in_user_database(%{
      SELECT
        ST_XMin(ST_Extent(#{column_name})) AS minx,
        ST_YMin(ST_Extent(#{column_name})) AS miny,
        ST_XMax(ST_Extent(#{column_name})) AS maxx,
        ST_YMax(ST_Extent(#{column_name})) AS maxy
      FROM #{safe_table_name_quoting(table_name)} AS subq
    }).first

    result
  end
end

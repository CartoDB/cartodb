# encoding: utf-8
require_relative '../../lib/carto/table_utils'
require_dependency 'carto/bounding_box_utils'

class Carto::BoundingBoxService
  include Carto::TableUtils

  def initialize(user, table_name)
    @user = user
    @table_name = table_name
  end

  def table_bounds
    # (lon,lat) as comes out from postgis
    result = current_bbox_using_stats
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
  def current_bbox_using_stats
    # Less ugly (for tests at least) than letting an exception generate not having any table name
    return nil unless @table_name.present?

    # (lon,lat) as comes from postgis
    JSON.parse(@user.db_service.execute_in_user_database(%{
      SELECT _postgis_stats ('#{@table_name}', 'the_geom');
    }).first['_postgis_stats'])['extent'].symbolize_keys
  rescue PG::Error => e
    if e.message =~ /stats for (.*) do not exist/i
      begin
        current_bbox
      rescue
        nil
      end
    end
  end

  def current_bbox
    # (lon, lat) as comes from postgis (ST_X = Longitude, ST_Y = Latitude)
    # map has no geometries
    result = get_bbox_values
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
    CartoDB::Logger.error(exception: exception, table: @table_name)
    raise BoundingBoxError.new("Can't calculate the bounding box for table #{@table_name}. ERROR: #{exception}")
  end

  def get_bbox_values
    result = @user.db_service.execute_in_user_database(%{
      SELECT
        ST_XMin(ST_Extent(the_geom)) AS minx,
        ST_YMin(ST_Extent(the_geom)) AS miny,
        ST_XMax(ST_Extent(the_geom)) AS maxx,
        ST_YMax(ST_Extent(the_geom)) AS maxy
      FROM #{safe_table_name_quoting(@table_name)} AS subq
    }).first

    result
  end
end

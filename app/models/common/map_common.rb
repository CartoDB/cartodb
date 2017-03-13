module Carto::MapBoundaries
  MAXIMUM_ZOOM = 18

  def set_default_boundaries!
    bounds = get_map_bounds
    set_boundaries(bounds)
    recenter_using_bounds(bounds)
    recalculate_zoom(bounds)
    save
  rescue => exception
    CartoDB::Logger.error(exception: exception, message: 'Error setting default bounds')
  end

  private

  def set_boundaries(bounds)
    # switch to (lat,lon) for the frontend
    self.view_bounds_ne = "[#{bounds[:maxy]}, #{bounds[:maxx]}]"
    self.view_bounds_sw = "[#{bounds[:miny]}, #{bounds[:minx]}]"
  end

  def recenter_using_bounds(bounds)
    x = (bounds[:maxx] + bounds[:minx]) / 2
    y = (bounds[:maxy] + bounds[:miny]) / 2
    self.center = "[#{y},#{x}]"
  end

  def recalculate_zoom(bounds)
    latitude_size = bounds[:maxy] - bounds[:miny]
    longitude_size = bounds[:maxx] - bounds[:minx]

    # Don't touch zoom if the table is empty or has no bounds
    return if longitude_size.zero? && latitude_size.zero?

    zoom = -1 * ((Math.log([longitude_size, latitude_size].max) / Math.log(2)) - (Math.log(360) / Math.log(2)))
    zoom = [[zoom.round, 1].max, MAXIMUM_ZOOM].min

    self.zoom = zoom
  end
end

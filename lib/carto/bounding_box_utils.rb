module Carto::BoundingBoxUtils
  DEFAULT_BOUNDS = {
    minx: -179,
    maxx: 179,
    miny: -85.0511,
    maxy: 85.0511
  }.freeze

  def self.bound_for(value, minimum, maximum)
    [[value, DEFAULT_BOUNDS.fetch(minimum)].max, DEFAULT_BOUNDS.fetch(maximum)].min
  end

  def self.to_polygon(minx, miny, maxx, maxy)
    return nil unless check_bounds_for(minx, miny) && check_bounds_for(maxx, maxy)
    %{ST_Transform(ST_Envelope('SRID=4326;POLYGON((#{minx} #{miny}, #{minx} #{maxy}, #{maxx} #{maxy}, #{maxx} #{miny}, #{minx} #{miny}))'::geometry), 3857)}
  end

  def self.to_point(x, y)
    return nil unless check_bounds_for(x, y)
    %[ST_GeomFromText('POINT(#{x} #{y})',3857)]
  end

  def self.parse_bbox_parameters(bounding_box)
    bbox_coords = bounding_box.split(',').map { |coord| Float(coord) rescue nil }.compact
    if bbox_coords.length != 4
      raise CartoDB::BoundingBoxError.new('bounding box must have 4 coordinates: minx, miny, maxx, maxy')
    end
    { minx: bbox_coords[0], miny: bbox_coords[1], maxx: bbox_coords[2], maxy: bbox_coords[3] }
  end

  def self.check_bounds_for(x, y)
    return false if x.to_f > LIMIT_BOUNDS[:maxlon].to_f || x.to_f < LIMIT_BOUNDS[:minlon].to_f
    return false if y.to_f > LIMIT_BOUNDS[:maxlat].to_f || y.to_f < LIMIT_BOUNDS[:minlat].to_f
    true
  rescue
    false
  end
end

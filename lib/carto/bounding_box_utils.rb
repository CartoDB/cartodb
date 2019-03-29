module Carto::BoundingBoxUtils
  DEFAULT_BOUNDS = {
    minx: -179,
    maxx: 179,
    miny: -85.0511,
    maxy: 85.0511
  }.freeze

  LIMIT_BOUNDS = {
    minx: -180,
    maxx: 180,
    miny: -90,
    maxy: 90
  }.freeze

  def self.bound_for(value, minimum, maximum)
    [[value, DEFAULT_BOUNDS.fetch(minimum)].max, DEFAULT_BOUNDS.fetch(maximum)].min
  end

  def self.to_polygon(minx, miny, maxx, maxy)
    return nil unless check_bounds_for(minx, miny) && check_bounds_for(maxx, maxy)
    "ST_Transform(ST_Envelope('SRID=4326;POLYGON((" \
      "#{minx} #{miny}, #{minx} #{maxy}, #{maxx} #{maxy}, #{maxx} #{miny}, #{minx} #{miny}" \
    "))'::geometry), 3857)"
  end

  def self.to_point(x, y)
    return nil unless check_bounds_for(x, y)
    %[ST_GeomFromText('POINT(#{x} #{y})',3857)]
  end

  def self.parse_bbox_parameters(bounding_box)
    bbox_coords = bounding_box.split(',').map { |coord| Float(coord) }.compact
    unless bbox_coords.length == 4
      raise CartoDB::BoundingBoxError.new('bounding box must have 4 coordinates: minx, miny, maxx, maxy')
    end
    { minx: bbox_coords[0], miny: bbox_coords[1], maxx: bbox_coords[2], maxy: bbox_coords[3] }
  rescue ArgumentError
    raise CartoDB::BoundingBoxError.new('all bounding box parameters must be floats')
  end

  def self.check_bounds_for(x, y)
    return false if Float(x) > LIMIT_BOUNDS[:maxx].to_f || Float(x) < LIMIT_BOUNDS[:minx].to_f
    return false if Float(y) > LIMIT_BOUNDS[:maxy].to_f || Float(y) < LIMIT_BOUNDS[:miny].to_f
    true
  rescue
    # Reject coordinate values for which Float() conversion fails.
    # e.g. nil values or Strings that do not contain just a valid numeric representation.
    false
  end
end

# encoding: utf-8

class Map < Sequel::Model
  self.raise_on_save_failure = false

  one_to_many   :tables
  many_to_one   :user

  many_to_many :layers, order: :order, after_add: proc { |map, layer| 
    layer.set_default_order(map)
  }

  many_to_many  :base_layers, clone: :layers, right_key: :layer_id

  many_to_many  :data_layers, clone: :layers, right_key: :layer_id, 
                conditions: { kind: "carto" }

  many_to_many  :user_layers, clone: :layers, right_key: :layer_id,
                conditions: "kind NOT LIKE 'carto'"

  plugin :association_dependencies, :layers => :nullify

  PUBLIC_ATTRIBUTES = %W{ id user_id provider bounding_box_sw
    bounding_box_ne center zoom view_bounds_sw view_bounds_ne }

  DEFAULT_OPTIONS = {
    zoom:            3,
    bounding_box_sw: [0, 0],
    bounding_box_ne: [0, 0],
    provider:        'leaflet',
    center:          [30, 0]
  }

  DEFAULT_BOUNDS = {
    minlon: -179,
    maxlon: 179,
    minlat: -85.0511,
    maxlat: 85.0511 
  }

  attr_accessor :table_id

  def before_save
    super
    self.updated_at = Time.now
  end #before_save

  def after_save
    super
    update_map_id_on_associated_table
    invalidate_varnish_cache
  end #after_save

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map { |a| [a, send(a)] }]
  end #public_values

  def validate
    super
    errors.add(:user_id, "can't be blank") if user_id.blank?
  end #validate

  def recalculate_bounds!
    result = get_map_bounds
    update(
      view_bounds_ne: "[#{result[:maxy]}, #{result[:maxx]}]",
      view_bounds_sw: "[#{result[:miny]}, #{result[:minx]}]"
    )
  rescue Sequel::DatabaseError => exception
    notify_airbrake(exception)
  end #recalculate_bounds!

  def viz_updated_at
    get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
  end #viz_updated_at

  def invalidate_varnish_cache
    t = tables_dataset.select(:id, :user_id, :name).first
    return true if t.blank?

    CartoDB::Varnish.new.purge(
      "obj.http.X-Cache-Channel ~ #{t.varnish_key}:vizjson"
    )
  end #invalidate_varnish_cache

  private

  def get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
    [tables.first.data_last_modified, data_layers.map(&:updated_at)]
      .flatten.compact.max
  end #get_the_last_time_tiles_have_changes_to_render_it_in_vizjsons
  
  def update_map_id_on_associated_table
    return unless table_id
    related_table = Table.filter(
                      id:       table_id,
                      user_id:  user_id
                    ).first
    related_table.this.update(map_id: id) if related_table.map_id != id
  end #updated_map_id_on_associated_tale

  def get_map_bounds
    result = current_map_bounds

    {
      maxx: bound_for(result[:maxx].to_f, :minlon, :maxlon),
      maxy: bound_for(result[:maxy].to_f, :minlat, :maxlat),
      minx: bound_for(result[:minx].to_f, :minlon, :maxlon),
      miny: bound_for(result[:miny].to_f, :minlat, :maxlat)
    }
  end #get_map_bounds

  def current_map_bounds
    user.in_database.fetch(%Q{
      SELECT 
        ST_XMin(ST_Extent(the_geom)) AS minx,
        ST_YMin(ST_Extent(the_geom)) AS miny,
        ST_XMax(ST_Extent(the_geom)) AS maxx,
        ST_YMax(ST_Extent(the_geom)) AS maxy
      FROM #{tables.first.name} AS subq
    }).first
  rescue Sequel::DatabaseError
    {}
  end #get_map_bounds

  def bound_for(value, minimum, maximum)
    minimum = DEFAULT_BOUNDS.fetch(minimum)
    maximum = DEFAULT_BOUNDS.fetch(maximum)

    return minimum if value < minimum
    return maximum if value > maximum
    return value
  end #bound_for
end # Map


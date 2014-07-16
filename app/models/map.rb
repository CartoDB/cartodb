# encoding: utf-8
require_relative './map/copier'
require_relative '../models/visualization/collection'


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
                conditions: "kind in ('tiled', 'background', 'gmapsbase', 'wms')"

  many_to_many  :carto_and_torque_layers, clone: :layers, right_key: :layer_id,
                conditions: "kind in ('carto', 'torque')"

  many_to_many  :torque_layers, clone: :layers, right_key: :layer_id,
                conditions: { kind: "torque" }

  many_to_many  :other_layers, clone: :layers, right_key: :layer_id,
                conditions: "kind not in ('carto', 'tiled', 'background', 'gmapsbase', 'wms')"

  plugin :association_dependencies, :layers => :nullify

  PUBLIC_ATTRIBUTES = %W{ id user_id provider bounding_box_sw
    bounding_box_ne center zoom view_bounds_sw view_bounds_ne scrollwheel }

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
    update_map_on_associated_entities
    invalidate_vizjson_varnish_cache
  end #after_save

  def before_destroy
    super
    invalidate_vizjson_varnish_cache
  end #before_destroy

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

  def invalidate_vizjson_varnish_cache
    visualizations.each do |visualization|
      visualization.invalidate_cache_and_refresh_named_map
    end
  end

  def copy_for(user)
    CartoDB::Map::Copier.new(self, user).copy
  end #copy

  def admits_layer?(layer)
    return admits_more_torque_layers? if layer.torque_layer?
    return admits_more_data_layers? if layer.data_layer?
    return admits_more_base_layers? if layer.base_layer?
  end #admits?

  def can_add_layer(user)
    current_vis = visualizations.first
    current_vis.has_permission?(user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
  end

  def all_members_have_permissions?(table_visualization)
    if table_visualization.public?
      true
    else
      current_vis = visualizations.first
      current_vis_users = current_vis.all_users_with_read_permission

      table_visualization.have_permission?(current_vis_users, CartoDB::Visualization::Member::PERMISSION_READONLY)
    end
  end

  def visualizations
    CartoDB::Visualization::Collection.new.fetch(map_id: [self.id]).to_a
  end #visualizations

  def process_privacy_in(layer)
    return self unless layer.uses_private_tables?

    visualizations.each do |visualization|
      unless visualization.organization?
        visualization.privacy = 'private'
        visualization.store
      end
    end
  end #process_privacy_in

  def set_tile_style_from(layer)
    return self unless is_table_visualization?
    table_visualization.table.send_tile_style_request(layer)
  end #set_tile_style_from

  private

  def get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
    table       = tables.first
    from_table  = table.data_last_modified if table

    [from_table, data_layers.map(&:updated_at)].flatten.compact.max
  end #get_the_last_time_tiles_have_changes_to_render_it_in_vizjsons

  def update_map_on_associated_entities
    return unless table_id

    # Cannot filter by user_id as might be a shared table not owned by us
    related_table = Table.filter(
                      id: table_id
                    ).first
    if related_table.map_id != id
      # Manually propagate to visualization (@see Table.after_save) if exists (at table creation won't)
      CartoDB::Visualization::Collection.new.fetch(
          user_id:  user_id,
          map_id:   related_table.map_id
      ).each { |entry|
        entry.map_id = id
        entry.store
      }
      # HERE BE DRAGONS! If we try to store using model, callbacks break hell. Manual update required
      related_table.this.update(map_id: id)
    end
  end

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

  def is_table_visualization?
    !!table_visualization
  end #is_table_visualization?

  def table_visualization
    CartoDB::Visualization::Collection.new
      .fetch(map_id: [self.id], type: CartoDB::Visualization::Member::CANONICAL_TYPE)
      .first
  end #table_visualization

  def admits_more_data_layers?
    return false if data_layers.length >= 1 && is_table_visualization?
    return true
  end #admits_mode_data_layers?

  def admits_more_torque_layers?
    return false if torque_layers.length >= 1 && is_table_visualization?
    return true
  end #admits_mode_data_layers?

  def admits_more_base_layers?
    user_layers.length < 1
  end #admits_mode_data_layers?
end # Map


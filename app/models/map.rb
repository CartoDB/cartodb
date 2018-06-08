# encoding: utf-8
require_relative '../models/visualization/collection'
require_relative '../models/table/user_table'
require_dependency 'carto/bounding_box_utils'
require_dependency 'common/map_common'

class Map < Sequel::Model
  include Carto::MapBoundaries

  self.raise_on_save_failure = false

  plugin :serialization, :json, :options

  one_to_many :tables, class: ::UserTable
  many_to_one :user

  many_to_many :layers,
               order: :order,
               after_add: proc { |map, layer| layer.after_added_to_map(map) }

  many_to_many :base_layers,
               clone: :layers,
               right_key: :layer_id

  many_to_many :carto_layers,
               clone: :layers,
               right_key: :layer_id,
               conditions: { kind: "carto" }

  many_to_many :data_layers,
               clone: :layers,
               right_key: :layer_id,
               conditions: "kind in ('carto', 'torque')"

  many_to_many :user_layers,
               clone: :layers,
               right_key: :layer_id,
               conditions: "kind in ('tiled', 'background', 'gmapsbase', 'wms')"

  many_to_many :torque_layers,
               clone: :layers,
               right_key: :layer_id,
               conditions: { kind: "torque" }

  many_to_many :other_layers,
               clone: :layers,
               right_key: :layer_id,
               conditions: "kind not in ('carto', 'tiled', 'background', 'gmapsbase', 'wms')"

  many_to_many :named_maps_layers,
               clone: :layers,
               right_key: :layer_id,
               conditions: "kind in ('tiled', 'background', 'gmapsbase', 'wms', 'carto')"

  plugin :association_dependencies, layers: :nullify

  PUBLIC_ATTRIBUTES = %w{ id user_id provider bounding_box_sw
                          bounding_box_ne center zoom view_bounds_sw view_bounds_ne legends scrollwheel }

  # FE code, so (lat,lon)
  DEFAULT_OPTIONS = {
    zoom:            3,
    bounding_box_sw: [Carto::BoundingBoxUtils::DEFAULT_BOUNDS[:miny],
                      Carto::BoundingBoxUtils::DEFAULT_BOUNDS[:minx]],
    bounding_box_ne: [Carto::BoundingBoxUtils::DEFAULT_BOUNDS[:maxy],
                      Carto::BoundingBoxUtils::DEFAULT_BOUNDS[:maxx]],
    provider:        'leaflet',
    center:          [30, 0]
  }

  attr_accessor :table_id,
                # Flag to detect if being destroyed by whom so invalidate_vizjson_varnish_cache skips it
                :being_destroyed_by_vis_id

  def before_save
    super
    self.updated_at = Time.now
  end

  def after_save
    super
    update_map_on_associated_entities
    notify_map_change
  end

  def notify_map_change
    visualization = visualizations.first

    force_notify_map_change
  end

  def force_notify_map_change
    update_related_named_maps
    invalidate_vizjson_varnish_cache
  end

  def before_destroy
    raise CartoDB::InvalidMember.new(user: "Viewer users can't destroy maps") if user && user.viewer
    layers.each(&:destroy)
    super
    invalidate_vizjson_varnish_cache
  end

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map { |a| [a, send(a)] }]
  end

  def validate
    super
    errors.add(:user_id, "can't be blank") if user_id.blank?
    errors.add(:user, "Viewer users can't save maps") if user && user.viewer
  end

  def viz_updated_at
    latest_mapcap = visualizations.first.latest_mapcap

    latest_mapcap ? latest_mapcap.created_at : get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
  end

  def invalidate_vizjson_varnish_cache
    visualizations.each do |visualization|
      visualization.invalidate_cache unless visualization.id == being_destroyed_by_vis_id
    end
  end

  def update_related_named_maps
    visualizations.each do |visualization|
      visualization.save_named_map unless visualization.id == being_destroyed_by_vis_id
    end
  end

  def admits_layer?(layer)
    return admits_more_torque_layers? if layer.torque_layer?
    return admits_more_data_layers? if layer.data_layer?
    return admits_more_base_layers?(layer) if layer.base_layer?
  end

  def can_add_layer?(user, layer)
    return true if layer.base_layer?
    return false if user.max_layers && user.max_layers <= data_layers.count
    return false if user.viewer

    current_vis = visualizations.first
    current_vis.has_permission?(user, CartoDB::Visualization::Member::PERMISSION_READWRITE)
  end

  def visualizations
    @visualizations_collection ||= CartoDB::Visualization::Collection.new.fetch(map_id: [id]).to_a
  end

  def visualization
    visualizations.first
  end

  def process_privacy_in(layer)
    return self unless layer.uses_private_tables?

    visualizations.each do |visualization|
      if visualization.can_be_private?
        visualization.privacy = CartoDB::Visualization::Member::PRIVACY_PRIVATE
        visualization.store
      end
    end
  end

  def self.provider_for_baselayer_kind(kind)
    kind == 'tiled' ? 'leaflet' : 'googlemaps'
  end

  # (lat,lon) points on all map data
  def center_data
    (center.nil? || center == '') ? DEFAULT_OPTIONS[:center] : center.gsub(/\[|\]|\s*/, '').split(',')
  end

  def view_bounds_data
    if view_bounds_sw.nil? || view_bounds_sw == ''
      bbox_sw = DEFAULT_OPTIONS[:bounding_box_sw]
    else
      bbox_sw = view_bounds_sw.gsub(/\[|\]|\s*/, '').split(',').map(&:to_f)
    end
    if view_bounds_ne.nil? || view_bounds_ne == ''
      bbox_ne = DEFAULT_OPTIONS[:bounding_box_ne]
    else
      bbox_ne = view_bounds_ne.gsub(/\[|\]|\s*/, '').split(',').map(&:to_f)
    end

    {
      # LowerCorner longitude, in decimal degrees
      west:  bbox_sw[1],
      # LowerCorner latitude, in decimal degrees
      south: bbox_sw[0],
      # UpperCorner longitude, in decimal degrees
      east:  bbox_ne[1],
      # UpperCorner latitude, in decimal degrees
      north: bbox_ne[0]
    }
  end

  def dup
    map = Map.new(to_hash.reject { |k, _| [:id, :options].include?(k) })
    map.options = options # Manually copied to avoid serialization
    map
  end

  private

  def get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
    table       = tables.first
    from_table  = table.service.data_last_modified if table

    [from_table, data_layers.map(&:updated_at)].flatten.compact.max
  end

  def update_map_on_associated_entities
    return unless table_id

    # Cannot filter by user_id as might be a shared table not owned by us
    related_table = ::UserTable.filter(id: table_id).first
    if related_table.map_id != id
      # Manually propagate to visualization (@see Table.after_save) if exists (at table creation won't)
      if related_table.map_id.present?
        CartoDB::Visualization::Collection.new.fetch(
          user_id: user_id,
          map_id: related_table.map_id
        ).each { |entry| entry.store_from_map(map_id: id) }
      end
      # HERE BE DRAGONS! If we try to store using model, callbacks break hell. Manual update required
      related_table.this.update(map_id: id)
    end
  end

  def table_visualization?
    !!table_visualization
  end

  def table_visualization
    CartoDB::Visualization::Collection.new
                                      .fetch(map_id: [id], type: CartoDB::Visualization::Member::TYPE_CANONICAL)
                                      .first
  end

  def admits_more_data_layers?
    data_layers.length >= 1 && table_visualization? ? false : true
  end

  def admits_more_torque_layers?
    torque_layers.length >= 1 && table_visualization? ? false : true
  end

  def admits_more_base_layers?(layer)
    # no basemap layer, always allow
    return true if user_layers.length < 1
    # have basemap? then allow only if comes on top (for labels)
    layer.order >= layers.last.order && user_layers.length >= 1
  end

  def table_name
    tables.first.nil? ? nil : tables.first.name
  end
end

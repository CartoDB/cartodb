require 'active_record'

require_relative '../../helpers/bounding_box_helper'

class Carto::Map < ActiveRecord::Base

  has_many :layers_maps
  has_many :layers, class_name: 'Carto::Layer',
                    order: '"order"',
                    through: :layers_maps

  has_many :base_layers, class_name: 'Carto::Layer',
                         order: '"order"',
                         through: :layers_maps,
                         source: :layer

  has_many :data_layers, class_name: 'Carto::Layer',
                         conditions: { kind: 'carto' },
                         order: '"order"',
                         through: :layers_maps,
                         source: :layer

  has_many :user_layers, class_name: 'Carto::Layer',
                         conditions: { kind: ['tiled', 'background', 'gmapsbase', 'wms'] },
                         order: '"order"',
                         through: :layers_maps,
                         source: :layer

  has_many :carto_and_torque_layers, class_name: 'Carto::Layer',
                                     conditions: { kind: ['carto', 'torque'] },
                                     order: '"order"',
                                     through: :layers_maps,
                                     source: :layer

  has_many :torque_layers, class_name: 'Carto::Layer',
                           conditions: { kind: 'torque' },
                           order: '"order"',
                           through: :layers_maps,
                           source: :layer

  has_many :other_layers, class_name: 'Carto::Layer',
                          conditions: "kind not in ('carto', 'tiled', 'background', 'gmapsbase', 'wms')",
                          order: '"order"',
                          through: :layers_maps,
                          source: :layer

  has_many :named_maps_layers, class_name: 'Carto::Layer',
                               conditions: { kind: ['carto', 'tiled', 'background', 'gmapsbase', 'wms'] },
                               order: '"order"',
                               through: :layers_maps,
                               source: :layer

  has_many :user_tables, class_name: Carto::UserTable, inverse_of: :map

  belongs_to :user

  has_many :visualizations, class_name: Carto::Visualization, inverse_of: :map

  DEFAULT_OPTIONS = {
    zoom:            3,
    bounding_box_sw: [BoundingBoxHelper::DEFAULT_BOUNDS[:minlat], BoundingBoxHelper::DEFAULT_BOUNDS[:minlon]],
    bounding_box_ne: [BoundingBoxHelper::DEFAULT_BOUNDS[:maxlat], BoundingBoxHelper::DEFAULT_BOUNDS[:maxlon]],
    provider:        'leaflet',
    center:          [30, 0]
  }.freeze

  def viz_updated_at
    get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
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

  def writable_by_user?(user)
    !visualizations.select { |v| v.is_writable_by_user(user) }.empty?
  end

  def contains_layer?(layer)
    return false unless layer

    layers_maps.map(&:layer_id).include?(layer.id)
  end

  def notify_map_change
    visualizations.each(&:save_named_map)
    visualizations.each(&:invalidate_cache)
  end

  private

  def get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
    table       = user_tables.first
    from_table  = table.service.data_last_modified if table

    [from_table, data_layers.map(&:updated_at)].flatten.compact.max
  end

end

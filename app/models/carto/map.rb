require 'active_record'

require_relative '../../helpers/bounding_box_helper'
require_relative './carto_json_serializer'

class Carto::Map < ActiveRecord::Base
  has_many :layers_maps
  has_many :layers, class_name: 'Carto::Layer',
                    order: '"order"',
                    through: :layers_maps,
                    after_add: Proc.new { |map, layer| layer.set_default_order(map) }

  has_many :base_layers, class_name: 'Carto::Layer',
                         order: '"order"',
                         through: :layers_maps,
                         source: :layer

  has_one :user_table, class_name: Carto::UserTable, inverse_of: :map

  belongs_to :user

  has_one :visualization, class_name: Carto::Visualization, inverse_of: :map

  DEFAULT_OPTIONS = {
    zoom:            3,
    bounding_box_sw: [BoundingBoxHelper::DEFAULT_BOUNDS[:minlat], BoundingBoxHelper::DEFAULT_BOUNDS[:minlon]],
    bounding_box_ne: [BoundingBoxHelper::DEFAULT_BOUNDS[:maxlat], BoundingBoxHelper::DEFAULT_BOUNDS[:maxlon]],
    provider:        'leaflet',
    center:          [30, 0]
  }.freeze

  serialize :options, ::Carto::CartoJsonSerializer
  validates :options, carto_json_symbolizer: true

  validate :validate_options

  after_initialize :ensure_options
  after_commit :force_notify_map_change

  def data_layers
    layers.select(&:carto?)
  end

  def user_layers
    layers.select(&:user_layer?)
  end

  def carto_and_torque_layers
    layers.select { |layer| layer.carto? || layer.torque? }
  end

  def torque_layers
    layers.select(&:torque?)
  end

  def other_layers
    layers.reject(&:carto?)
          .reject(&:tiled?)
          .reject(&:background?)
          .reject(&:gmapsbase?)
          .reject(&:wms?)
  end

  def named_map_layers
    layers.select(&:named_map_layer?)
  end

  def viz_updated_at
    latest_mapcap = visualization.latest_mapcap

    latest_mapcap ? latest_mapcap.created_at : get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
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
    visualization.writable_by?(user)
  end

  def contains_layer?(layer)
    return false unless layer

    layers_maps.map(&:layer_id).include?(layer.id)
  end

  def notify_map_change
    map = ::Map[id]
    map.notify_map_change if map
  end

  def force_notify_map_change
    map = ::Map[id]
    map.force_notify_map_change if map
  end

  def update_dataset_dependencies
    data_layers.each(&:register_table_dependencies)
  end

  def dashboard_menu=(value)
    options[:dashboard_menu] = value
  end

  def dashboard_menu
    options[:dashboard_menu]
  end

  def layer_selector=(value)
    options[:layer_selector] = value
  end

  def layer_selector
    options[:layer_selector]
  end

  def admits_layer?(layer)
    return admits_more_torque_layers? if layer.torque?
    return admits_more_data_layers? if layer.data_layer?
    return admits_more_base_layers?(layer) if layer.base_layer?
  end

  def can_add_layer?(user)
    return false if user.max_layers && user.max_layers <= carto_and_torque_layers.count

    visualization.writable_by?(user)
  end

  def process_privacy_in(layer)
    if layer.uses_private_tables? && visualization.can_be_private?
      visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
      visualization.save
    end
  end

  private

  def admits_more_data_layers?
    !visualization.canonical? || data_layers.empty?
  end

  def admits_more_torque_layers?
    !visualization.canonical? || torque_layers.empty?
  end

  def admits_more_base_layers?(layer)
    # no basemap layer, always allow
    return true if user_layers.empty?
    # have basemap? then allow only if comes on top (for labels)
    layer.order >= layers.last.order
  end

  def ensure_options
    self.options ||= {}
    options[:dashboard_menu] = true if options[:dashboard_menu].nil?
    options[:layer_selector] = false if options[:layer_selector].nil?
    options[:legends] = legends if options[:legends].nil?
    options[:scrollwheel] = scrollwheel if options[:scrollwheel].nil?

    options
  end

  def validate_options
    location = "#{Rails.root}/lib/formats/map/options.json"
    schema = Carto::Definition.instance.load_from_file(location)

    options_wia = options.with_indifferent_access
    json_errors = JSON::Validator.fully_validate(schema, options_wia)
    errors.add(:options, json_errors.join(', ')) if json_errors.any?
  end

  def get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
    from_table = user_table.service.data_last_modified if user_table

    [from_table, data_layers.map(&:updated_at)].flatten.compact.max
  end

end

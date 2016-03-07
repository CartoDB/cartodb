# encoding: utf-8

require_relative 'layer/presenter'
require_relative 'table/user_table'
require_relative '../../lib/cartodb/stats/editor_apis'


class Layer < Sequel::Model
  plugin :serialization, :json, :options, :infowindow, :tooltip

  ALLOWED_KINDS = %W{ carto tiled background gmapsbase torque wms }
  BASE_LAYER_KINDS  = %w(tiled background gmapsbase wms)
  DATA_LAYER_KINDS = ALLOWED_KINDS - BASE_LAYER_KINDS

  PUBLIC_ATTRIBUTES = %W{ options kind infowindow tooltip id order }

  TEMPLATES_MAP = {
    'table/views/infowindow_light' =>               'infowindow_light',
    'table/views/infowindow_dark' =>                'infowindow_dark',
    'table/views/infowindow_light_header_blue' =>   'infowindow_light_header_blue',
    'table/views/infowindow_light_header_yellow' => 'infowindow_light_header_yellow',
    'table/views/infowindow_light_header_orange' => 'infowindow_light_header_orange',
    'table/views/infowindow_light_header_green' =>  'infowindow_light_header_green',
    'table/views/infowindow_header_with_image' =>   'infowindow_header_with_image'
  }

  # Sets default order to the maximum order of the sibling layers + 1
  def set_default_order(parent)
    max_order = parent.layers_dataset.select(:order).map(&:order).compact.max
    order = (max_order == nil ? 0 : max_order + 1)
    self.update(:order => order) if self.order.blank?
  end

  many_to_many :maps,  :after_add => proc { |layer, parent| layer.set_default_order(parent) }
  many_to_many :users, :after_add => proc { |layer, parent| layer.set_default_order(parent) }
  many_to_many :user_tables,
                join_table: :layers_user_tables,
                left_key: :layer_id, right_key: :user_table_id,
                reciprocal: :layers, class: ::UserTable

  plugin  :association_dependencies, :maps => :nullify, :users => :nullify, :user_tables => :nullify

  def public_values
    Hash[ PUBLIC_ATTRIBUTES.map { |attribute| [attribute, send(attribute)] } ]
  end

  def validate
    super
    errors.add(:kind, "not accepted") unless ALLOWED_KINDS.include?(kind)

    if ((Cartodb.config[:enforce_non_empty_layer_css] rescue true))
      style = options.include?('tile_style') ? options['tile_style'] : nil
      if style.nil? || style.strip.empty?
        errors.add(:options, 'Tile style is empty')
        stats_aggregator = CartoDB::Stats::EditorAPIs.instance
        stats_aggregator.increment("errors.layer.empty-css")
        stats_aggregator.increment("errors.total")
      end
    end
  end

  def before_save
    super
    self.updated_at = Time.now
  end

  def to_json(*args)
    public_values.merge(
      infowindow: self.values[:infowindow].nil? ? {} : JSON.parse(self.values[:infowindow]),
      tooltip: JSON.parse(self.values[:tooltip]),
      options: self.values[:options].nil? ? {} : JSON.parse(self.values[:options])
    ).to_json(*args)
  end

  def after_save
    super
    maps.each(&:update_related_named_maps)
    maps.each(&:invalidate_vizjson_varnish_cache)

    register_table_dependencies if data_layer?
  end

  def before_destroy
    maps.each(&:update_related_named_maps)
    maps.each(&:invalidate_vizjson_varnish_cache)
    super
  end

  # Returns an array of tables used on the layer
  def affected_tables
    return [] unless maps.first.present? && options.present?
    (tables_from_query_option + tables_from_table_name_option).compact.uniq
  end

  def key
    "rails:layer_styles:#{self.id}"
  end

  def infowindow_template_path
    if self.infowindow.present? && self.infowindow['template_name'].present?
      template_name = TEMPLATES_MAP.fetch(self.infowindow['template_name'], self.infowindow['template_name'])
      Rails.root.join("lib/assets/javascripts/cartodb/table/views/infowindow/templates/#{template_name}.jst.mustache")
    else
      nil
    end
  end

  def tooltip_template_path
    if self.tooltip.present? && self.tooltip['template_name'].present?
      template_name = TEMPLATES_MAP.fetch(self.tooltip['template_name'], self.tooltip['template_name'])
      Rails.root.join("lib/assets/javascripts/cartodb/table/views/tooltip/templates/#{template_name}.jst.mustache")
    else
      nil
    end
  end

  def copy(override_attributes={})
    attributes = public_values.select { |k, v| k != 'id' }.merge(override_attributes)
    ::Layer.new(attributes)
  end

  def data_layer?
    kind == 'carto'
  end

  def torque_layer?
    kind == 'torque'
  end

  def base_layer?
    BASE_LAYER_KINDS.include?(kind)
  end

  def basemap?
    ["gmapsbase", "tiled"].include?(kind)
  end

  def supports_labels_layer?
    basemap? && options["labels"] && options["labels"]["url"]
  end

  def register_table_dependencies(db=Rails::Sequel.connection)
    db.transaction do
      delete_table_dependencies
      insert_table_dependencies
    end
  end

  def rename_table(current_table_name, new_table_name)
    return self unless data_layer? or torque_layer?
    target_keys = %w{ table_name tile_style query }

    options = JSON.parse(self[:options])
    targets = options.select { |key, value| target_keys.include?(key) }
    renamed = targets.map do |key, value|
      [key, rename_in(value, current_table_name, new_table_name)]
    end

    self.options = options.merge(Hash[renamed])
    self
  end

  def uses_private_tables?
    !(affected_tables.select(&:private?).empty?)
  end

  def legend
    options['legend']
  end

  def get_presenter(options, configuration)
    CartoDB::LayerModule::Presenter.new(self, options, configuration)
  end

  def set_option(key, value)
    return unless data_layer?

    self.options[key] = value
  end

  def qualified_table_name(viewer_user)
    "#{viewer_user.sql_safe_database_schema}.#{options['table_name']}"
  end

  private

  def rename_in(target, anchor, substitution)
    return if target.nil? || target.empty?
    regex = /(\A|\W+)(#{anchor})(\W+|\z)/
    target.gsub(regex) { |match| match.gsub(anchor, substitution) }
  end

  def delete_table_dependencies
    # remove_* and remove_all_* do not delete the object from the database
    # only disassociate the associated object from the receiver
    user_tables.map { |table| remove_user_table(table) }
  end

  def insert_table_dependencies
    affected_tables.map { |table| add_user_table(table) }
  end

  def tables_from_query_option
    return [] unless query.present?
    ::Table.get_all_by_names(affected_table_names, user)
  rescue => exception
    []
  end

  def tables_from_table_name_option
    ::Table.get_all_by_names([options.symbolize_keys[:table_name]], user)
  end

  def affected_table_names
    CartoDB::SqlParser.new(query, connection: user.in_database).affected_tables
  end

  def user
    maps.first.user
  end

  def query
    options.symbolize_keys[:query]
  end
end

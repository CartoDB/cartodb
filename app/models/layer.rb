require_relative 'layer/presenter'
require_relative 'table/user_table'
require_relative '../../lib/cartodb/stats/editor_apis'
require_dependency 'carto/table_utils'
require_dependency 'carto/query_rewriter'
require_relative 'carto/layer'

class Layer < Sequel::Model
  include Carto::TableUtils
  include Carto::LayerTableDependencies
  include Carto::QueryRewriter

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

  many_to_many :maps,  after_add: proc { |layer, parent| layer.after_added_to_map(parent) }
  many_to_many :users, after_add: proc { |layer, parent| layer.set_default_order(parent) }
  many_to_many :user_tables,
                join_table: :layers_user_tables,
                left_key: :layer_id, right_key: :user_table_id,
                reciprocal: :layers, class: ::UserTable

  plugin  :association_dependencies, :maps => :nullify, :users => :nullify, :user_tables => :nullify

  def layer_node_styles
    Carto::LayerNodeStyle.where(layer_id: id)
  end

  def public_values
    Hash[ PUBLIC_ATTRIBUTES.map { |attribute| [attribute, send(attribute)] } ]
  end

  def validate
    super
    errors.add(:kind, "not accepted") unless ALLOWED_KINDS.include?(kind)
    errors.add(:maps, "Viewer users can't edit layers") if maps.find { |m| m.user && m.user.viewer }

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
    maps.each(&:notify_map_change)

    if data_layer?
      register_table_dependencies
      update_layer_node_style
    end
  end

  def before_destroy
    raise CartoDB::InvalidMember.new(user: "Viewer users can't destroy layers") if user && user.viewer
    maps.each(&:notify_map_change)
    super
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
  alias dup copy

  def data_layer?
    !base_layer?
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
    basemap? && options["labels"] && options["labels"]["urlTemplate"]
  end

  def register_table_dependencies(db=SequelRails.connection)
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
    user_tables.select(&:private?).any?
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
    "#{viewer_user.sql_safe_database_schema}.#{safe_table_name_quoting(options['table_name'])}"
  end

  def user
    map.user if map
  end

  def qualify_for_organization(owner_username)
    options['query'] = qualify_query(query, options['table_name'], owner_username) if query
  end

  def after_added_to_map(map)
    set_default_order(map)
    register_table_dependencies
  end

  def source_id
    options && options.symbolize_keys[:source]
  end

  def depends_on?(table)
    user_tables.map(&:id).include?(table.id)
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

  def tables_from_names(table_names, user)
    ::Table.get_all_by_names(table_names, user)
  end

  def affected_table_names(query)
    query_tables = user.in_database["SELECT unnest(CDB_QueryTablesText(?))", query]
    query_tables.map(:unnest)
  end

  def map
    maps.first
  end

  def query
    options.symbolize_keys[:query]
  end

  def update_layer_node_style
    style = current_layer_node_style
    if style
      style.update_from_layer(self)
      style.save
    end
  end

  def current_layer_node_style
    return unless source_id

    Carto::LayerNodeStyle.find_or_initialize_by(layer_id: id, source_id: source_id)
  end
end

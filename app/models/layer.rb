# encoding: utf-8

require_relative 'layer/presenter'

class Layer < Sequel::Model
  plugin :serialization, :json, :options, :infowindow
  
  ALLOWED_KINDS = %W{ carto tiled background gmapsbase torque wms }
  BASE_LAYER_KINDS  = %w(tiled background gmapsbase wms)
  PUBLIC_ATTRIBUTES = %W{ options kind infowindow id order }
  TEMPLATES_MAP = {
    'table/views/infowindow_light' =>               'infowindow_light',
    'table/views/infowindow_dark' =>                'infowindow_dark',
    'table/views/infowindow_light_header_blue' =>   'infowindow_light_header_blue',
    'table/views/infowindow_light_header_yellow' => 'infowindow_light_header_yellow',
    'table/views/infowindow_light_header_orange' => 'infowindow_light_header_orange',
    'table/views/infowindow_light_header_green' =>  'infowindow_light_header_green',
    'table/views/infowindow_header_with_image' =>   'infowindow_header_with_image'
  }
  
  ##
  # Sets default order to the maximum order of the sibling layers + 1  
  #
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
                reciprocal: :layers, class: Table
  
  plugin  :association_dependencies, :maps => :nullify, :users => :nullify,
          :user_tables => :nullify

  def public_values
    Hash[ PUBLIC_ATTRIBUTES.map { |attribute| [attribute, send(attribute)] } ]
  end #public_values

  def validate
    super
    errors.add(:kind, "not accepted") unless ALLOWED_KINDS.include?(kind)

    if ((Cartodb.config[:enforce_non_empty_layer_css] rescue true))
      style = options.include?('tile_style') ? options['tile_style'] : nil
      if style.nil? || style.strip.empty?
        errors.add(:options, 'Tile style is empty')
        Statsd.increment('cartodb-com.errors.empty-css')
        Statsd.increment('cartodb-com.errors.total')
      end
    end
  end #validate

  def before_save
    super  
    self.updated_at = Time.now
  end

  def to_json(*args)
    public_values.merge(
      infowindow: JSON.parse(self.values[:infowindow]),
      options:    JSON.parse(self.values[:options])
    ).to_json(*args)
  end

  def after_save
    super
    maps.each(&:invalidate_vizjson_varnish_cache)
    maps.each { |map| map.set_tile_style_from(self) }   if data_layer?
    affected_tables.each(&:invalidate_varnish_cache)    if data_layer?
    register_table_dependencies                         if data_layer?
  end

  def before_destroy
    maps.each(&:invalidate_vizjson_varnish_cache)
    super
  end #before_destroy

  ##
  # Returns an array of tables used on the layer
  #
  def affected_tables
    return [] unless maps.first.present? && options.present?
    (tables_from_query_option + tables_from_table_name_option).compact.uniq
  end #affected_tables

  def key
    "rails:layer_styles:#{self.id}"
  end

  def template_path
    if self.infowindow.present? && self.infowindow['template_name'].present?
      template_name = TEMPLATES_MAP.fetch(self.infowindow['template_name'], self.infowindow['template_name'])
      Rails.root.join("lib/assets/javascripts/cartodb/table/views/infowindow/templates/#{template_name}.jst.mustache")
    else
      nil
    end
  end

  def copy
    attributes = public_values.select { |k, v| k != 'id' }
    ::Layer.new(attributes)
  end #copy

  def data_layer?
    kind == 'carto'
  end #data_layer?

  def torque_layer?
    kind == 'torque'
  end #data_layer?

  def base_layer?
    BASE_LAYER_KINDS.include?(kind) # TODO: ask Lorenzo
  end #base_layer?

  def register_table_dependencies(db=Rails::Sequel.connection)
    db.transaction do
      delete_table_dependencies
      insert_table_dependencies
    end
  end #register_table_dependencies

  def rename_table(current_table_name, new_table_name)
    return self unless data_layer?
    target_keys = %w{ table_name tile_style query }

    options = JSON.parse(self[:options])
    targets = options.select { |key, value| target_keys.include?(key) }
    renamed = targets.map do |key, value|
      [key, rename_in(value, current_table_name, new_table_name)]
    end

    self.options = options.merge(Hash[renamed])
    self
  end #rename_table

  def uses_private_tables?
    !(affected_tables.select(&:private?).empty?)
  end #uses_private_tables?

  def legend
    options['legend']
  end #legend

  def get_presenter(options, configuration)
    CartoDB::Layer::Presenter.new(self, options, configuration)
  end #get_presenter

  private

  def rename_in(target, anchor, substitution)
    return if target.nil? || target.empty?
    regex = /(\A|\W+)(#{anchor})(\W+|\z)/
    target.gsub(regex) { |match| match.gsub(anchor, substitution) }
  end #rename_in

  def delete_table_dependencies
    user_tables.map { |table| remove_user_table(table) }
  end #delete_table_dependencies

  def insert_table_dependencies
    affected_tables.map { |table| add_user_table(table) }
  end #insert_table_dependencies

  def tables_from_query_option
    return [] unless query.present?
    tables_from(affected_table_names)
  rescue => exception
    []
  end

  def tables_from_table_name_option
    tables_from([options.symbolize_keys[:table_name]])
  end #tables_from_table_name_option

  def tables_from(names)
    Table.where(user_id: user.id, name: names).all
  end #tables_from

  def affected_table_names
    CartoDB::SqlParser.new(query, connection: user.in_database).affected_tables
  end #affected_table_names

  def user
    maps.first.user
  end #user

  def query
    options.symbolize_keys[:query]
  end #query
end

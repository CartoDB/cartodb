# encoding: utf-8

class Layer < Sequel::Model
  plugin :serialization, :json, :options, :infowindow
  
  ALLOWED_KINDS = %W{ carto tiled background gmapsbase }
  PUBLIC_ATTRIBUTES = %W{ options kind infowindow id order }

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
  end

  def before_save
    super  
    self.updated_at = Time.now
  end

  def after_save
    super
    maps.each(&:invalidate_vizjson_varnish_cache)
    affected_tables.each(&:invalidate_varnish_cache) if data_layer?
    register_table_dependencies if data_layer?
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
      Rails.root.join("lib/assets/javascripts/cartodb/#{self.infowindow['template_name']}.jst.mustache")
    else
      nil
    end
  end

  def to_tilejson
    o = JSON.parse(self.values[:options])
    if self.kind == 'carto'

      url = o['tiler_protocol'] + "://" + o['user_name'] + "." + o['tiler_domain'] + ":" + o ['tiler_port'] + "/tiles/" + o['table_name'] + "/{z}/{x}/{y}.png"

    else
      url = o['urlTemplate']
    end

    return {
      "version" => "1.0.0",
      "scheme" => "xyz",
      "tiles" => [url]
    }.to_json
  end

  def copy
    attributes = public_values.select { |k, v| k != 'id' }
    Layer.new(attributes)
  end #copy

  def data_layer?
    kind == 'carto'
  end #data_layer?

  def base_layer?
    !data_layer?
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

  private

  def rename_in(target, anchor, substitution)
    return if target.nil? || target.empty?
    regex = /(\A|\W+)(#{anchor})(\W+|\z)/
    target.gsub!(regex) { |match| match.gsub(anchor, substitution) }
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

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
  
  plugin :association_dependencies, :maps => :nullify, :users => :nullify

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a.sub(/_for_api$/, ''), self.send(a)] }]
  end

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

    # Invalidate varnish cache (vizjson) for all the maps including this layer
    maps.each { |map| map.invalidate_varnish_cache }

    # Invalidate related tables cache on varnish (only for carto layers)
    affected_tables.map &:invalidate_varnish_cache if kind == 'carto'
  end

  ##
  # Returns an array of tables used on the layer
  #
  def affected_tables
    if maps.first.present? && options.present? && options.symbolize_keys[:query].present?
      begin
        query = options.symbolize_keys[:query]
        tables_per_statement = maps.first.user.in_database.select { 
          cdb_querytables(Sequel.function(:cdb_querystatements, query))
        }.all

        tables_per_statement.map do |s|
          s[:cdb_querytables].split(',').map do |table_name|
            table_name.gsub!(/[\{\}]/, '') 
            Table.select(:id, :name, :user_id)
              .where(user_id: maps.first.user.id, name: table_name).all
          end
        end.flatten.compact.uniq
      rescue Sequel::DatabaseError
        []
      end
    else
      []
    end
  end

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
end

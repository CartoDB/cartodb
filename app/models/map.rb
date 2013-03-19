class Map < Sequel::Model
  many_to_many :layers, :order => :order, :after_add => proc { |map, layer| 
    layer.set_default_order(map)
  }

  many_to_many :data_layers, :clone => :layers, :right_key => :layer_id, :conditions => { :kind => "carto" }
  many_to_many :base_layers, :clone => :layers, :right_key => :layer_id

  one_to_many :tables
  many_to_one :user

  plugin :association_dependencies, :layers => :nullify
  self.raise_on_save_failure = false

  PUBLIC_ATTRIBUTES = %W{ id user_id provider bounding_box_sw bounding_box_ne center zoom view_bounds_sw view_bounds_ne }

  DEFAULT_OPTIONS = {
    zoom:            3,
    bounding_box_sw: [0, 0],
    bounding_box_ne: [0, 0],
    provider:        'leaflet',
    center:          [30, 0]
  }

  DEFAULT_BOUNDS = { minlon: -179, maxlon: 179, minlat: -85.0511, maxlat: 85.0511 }

  attr_accessor :table_id

  def before_save
    super
    self.updated_at = Time.now
  end

  def after_save
    super
    # Keep updated related table map_id (temporal fix)
    if self.table_id.present?
      related_table = Table.filter(user_id: self.user_id, id: self.table_id).first
      related_table.this.update(map_id: self.id) if self.table_id != related_table.map_id
    end

    self.invalidate_varnish_cache
  end

  def public_values
    Hash[PUBLIC_ATTRIBUTES.map{ |a| [a, self.send(a)] }]
  end

  def validate
    super

    errors.add(:user_id, "can't be blank") if user_id.blank?
    #errors.add(:table_id, "can't be blank") if table_id.blank?
    #errors.add(:user_id, "does not exist") if user_id.present? && User[user_id].nil?
    #errors.add(:table_id, "table #{table_id} doesn't belong to user #{user_id}") if user_id.present? && !User[user_id].tables.select(:id).map(&:id).include?(table_id)
  end

  def invalidate_varnish_cache
    t = self.tables_dataset.select(:id, :user_id, :name).first
    CartoDB::Varnish.new.purge("obj.http.X-Cache-Channel ~ #{t.varnish_key}:vizjson")
  end

  def recalculate_bounds!
    begin
      result = get_map_bounds
      self.update(view_bounds_ne: "[#{result[:maxy]}, #{result[:maxx]}]", view_bounds_sw: "[#{result[:miny]}, #{result[:minx]}]")
    rescue Sequel::DatabaseError => ex
      notify_airbrake(ex)
    end
  end

  def get_map_bounds
    begin
      result = user.in_database.fetch("SELECT ST_XMin(ST_Extent(the_geom)) as minx,ST_YMin(ST_Extent(the_geom)) as miny, ST_XMax(ST_Extent(the_geom)) as maxx,ST_YMax(ST_Extent(the_geom)) as maxy from #{self.tables.first.name} as subq").first
    rescue Sequel::DatabaseError
      result = {}
    end
    
    result[:maxx] = result[:maxx].to_f < DEFAULT_BOUNDS[:minlon] ? DEFAULT_BOUNDS[:minlon] : result[:maxx].to_f > DEFAULT_BOUNDS[:maxlon] ? DEFAULT_BOUNDS[:maxlon] : result[:maxx].to_f
    result[:maxy] = result[:maxy].to_f < DEFAULT_BOUNDS[:minlat] ? DEFAULT_BOUNDS[:minlat] : result[:maxy].to_f > DEFAULT_BOUNDS[:maxlat] ? DEFAULT_BOUNDS[:maxlat] : result[:maxy].to_f
    result[:minx] = result[:minx].to_f < DEFAULT_BOUNDS[:minlon] ? DEFAULT_BOUNDS[:minlon] : result[:minx].to_f > DEFAULT_BOUNDS[:maxlon] ? DEFAULT_BOUNDS[:maxlon] : result[:minx].to_f
    result[:miny] = result[:miny].to_f < DEFAULT_BOUNDS[:minlat] ? DEFAULT_BOUNDS[:minlat] : result[:miny].to_f > DEFAULT_BOUNDS[:maxlat] ? DEFAULT_BOUNDS[:maxlat] : result[:miny].to_f

    return result
  end

  ##
  # This is the updated_at value we're using on vizjsons,
  # represents the last time the tiles have changed
  #
  def viz_updated_at
    [tables.first.data_last_modified, data_layers.map(&:updated_at)].flatten.compact.max
  end
end

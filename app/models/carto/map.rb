require 'active_record'

class Carto::Map < ActiveRecord::Base

  has_and_belongs_to_many :layers, class_name: 'Carto::Layer', order: '"order"'

  has_and_belongs_to_many :base_layers, class_name: 'Carto::Layer', order: '"order"'

  has_and_belongs_to_many :data_layers, class_name: 'Carto::Layer', 
    conditions: { kind: 'carto' }, order: '"order"'
    
  has_and_belongs_to_many :user_layers, class_name: 'Carto::Layer', 
    conditions: { kind: ['tiled', 'background', 'gmapsbase', 'wms'] }, order: '"order"'

  has_and_belongs_to_many :carto_and_torque_layers, class_name: 'Carto::Layer', 
    conditions: { kind: ['carto', 'torque'] }, order: '"order"'

  has_and_belongs_to_many :torque_layers, class_name: 'Carto::Layer',
    conditions: { kind: 'torque' }, order: '"order"'

  has_and_belongs_to_many :other_layers, class_name: 'Carto::Layer', 
    conditions: "kind not in ('carto', 'tiled', 'background', 'gmapsbase', 'wms')", order: '"order"'

  has_and_belongs_to_many :named_maps_layers, class_name: 'Carto::Layer', 
    conditions: { kind: ['carto', 'tiled', 'background', 'gmapsbase', 'wms'] }, order: '"order"'

  belongs_to :user

  has_many :tables, class_name: Carto::UserTable

  def viz_updated_at
    get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
  end

  def self.provider_for_baselayer(layer)
    layer[:kind] == 'tiled' ? 'leaflet': 'googlemaps'
  end


  private

  def get_the_last_time_tiles_have_changed_to_render_it_in_vizjsons
    table       = tables.first
    from_table  = table.service.data_last_modified if table

    [from_table, data_layers.map(&:updated_at)].flatten.compact.max
  end

end

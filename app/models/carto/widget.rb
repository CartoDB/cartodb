# encoding: UTF-8

class Carto::Widget < ActiveRecord::Base
  belongs_to :layer, class_name: Carto::Layer

  validate :dataview_layer_id_must_match

  def widget_json_json
    JSON.parse(widget_json).symbolize_keys
  end

  def dataview
    widget_json_json[:dataview]
  end

  def belongs_to_map?(map_id)
    !layer.nil? && !layer.maps.nil? && layer.maps.map(&:id).include?(map_id)
  end

  private

  def dataview_layer_id_must_match
    dataview_layer_id = dataview['layer_id']
    if dataview_layer_id && dataview_layer_id != layer_id
      errors.add(:layer_id, "Layer id (#{layer_id}) and dataview layer_id (#{dataview_layer_id}) do not match")
    end
  end
end

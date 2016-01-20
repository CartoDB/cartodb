# encoding: UTF-8

class Carto::Widget < ActiveRecord::Base
  belongs_to :layer, class_name: Carto::Layer
 
  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  def dataview_json
    JSON.parse(dataview).symbolize_keys
  end

  def belongs_to_map?(map_id)
    !layer.nil? && !layer.maps.nil? && layer.maps.map(&:id).include?(map_id)
  end

  def viewable_by_user?(user)
    return false unless layer
    return false unless layer.maps

    visualizations = Carto::Visualization.where(map_id: layer.maps(&:id)).all

    !visualizations.select { |v| v.is_viewable_by_user?(user) }.empty?
  end

end

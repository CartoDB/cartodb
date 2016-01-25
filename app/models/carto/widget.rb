# encoding: UTF-8

class Carto::Widget < ActiveRecord::Base
  belongs_to :layer, class_name: Carto::Layer

  validates :layer, :order, :type, :options, presence: true

  def self.from_visualization_id(visualization_id)
    Carto::Visualization.find(visualization_id).layers.map { |l| l.widgets }.flatten
  end

  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  def options_json
    JSON.parse(options).symbolize_keys
  end

  def belongs_to_map?(map_id)
    !layer.nil? && !layer.maps.nil? && layer.maps.map(&:id).include?(map_id)
  end

  def writable_by_user?(user)
    return false unless layer
    return false unless layer.maps

    layer.maps { |l| l.writable_by_user?(user) }.select { |writable| !writable }.empty?
  end

end

# encoding: UTF-8

class Carto::Widget < ActiveRecord::Base
  belongs_to :layer, class_name: Carto::Layer

  validates :layer, :order, :type, :options, presence: true

  validate :options_must_be_json

  after_save :notify_maps_change
  after_destroy :notify_maps_change

  def self.from_visualization_id(visualization_id)
    visualization = Carto::Visualization.where(id: visualization_id).first
    visualization.nil? ? [] : visualization.widgets.flatten
  end

  def self.visualization_analysis_widgets(visualization_id)
    visualization = Carto::Visualization.where(id: visualization_id).first
    visualization.nil? ? [] : visualization.analysis_widgets
  end

  def self.layer_widgets(layer_id)
    Carto::Widget.where(layer_id: layer_id).where(source_id: nil).all
  end

  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  def options_json
    JSON.parse(options).symbolize_keys
  end

  def options_json=(options)
    self.options = options.to_json
  end

  def belongs_to_map?(map_id)
    !layer.nil? && !layer.maps.nil? && layer.maps.map(&:id).include?(map_id)
  end

  def writable_by_user?(user)
    return false unless layer
    return false unless layer.maps

    layer.maps { |l| l.writable_by_user?(user) }.select { |writable| !writable }.empty?
  end

  private

  def options_must_be_json
    options_json
  rescue JSON::ParserError
    errors.add(:options, 'is wrongly formatted (invalid JSON)')
  end

  def notify_maps_change
    layer.maps.each do |m|
      map = Map.where(id: m.id).first
      map.notify_map_change if map
    end
  end
end

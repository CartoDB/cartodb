require_relative './carto_json_serializer'

class Carto::Widget < ActiveRecord::Base
  # INFO: disable ActiveRecord inheritance column
  self.inheritance_column = :_type

  serialize :options, ::Carto::CartoJsonSymbolizerSerializer
  validates :options, carto_json_symbolizer: true

  serialize :style, ::Carto::CartoJsonSymbolizerSerializer
  validates :style, carto_json_symbolizer: true

  belongs_to :layer, class_name: Carto::Layer

  before_validation :set_style_if_nil
  validates :layer, :order, :type, :options, :source_id, presence: true
  validates :source_id, presence: true

  validate :validate_user_not_viewer
  validate :valid_source_id

  before_destroy :validate_user_not_viewer

  after_save    :notify_maps_change, :auto_generate_indices
  after_destroy :notify_maps_change, :auto_generate_indices

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

  def belongs_to_map?(map_id)
    !layer.nil? && !layer.maps.nil? && layer.maps.map(&:id).include?(map_id)
  end

  def writable_by_user?(user)
    return false unless layer
    return false unless layer.maps

    layer.maps { |l| l.writable_by_user?(user) }.select { |writable| !writable }.empty?
  end

  def visualization
    layer.visualization
  end

  def analysis_node
    return nil unless source_id
    analysis_nodes = visualization.analyses.map(&:analysis_node)
    analysis_nodes.lazy.map { |node| node.find_by_id(source_id) }.find { |node| node }
  end

  def column
    options[:column]
  end

  private

  def set_style_if_nil
    self.style ||= {}
  end

  def notify_maps_change
    layer.maps.each do |m|
      map = Map.where(id: m.id).first
      map.notify_map_change if map
    end
  end

  def auto_generate_indices
    layer.user_tables.each do |ut|
      ::Resque.enqueue(::Resque::UserDBJobs::UserDBMaintenance::AutoIndexTable, ut.id)
    end
  end

  def validate_user_not_viewer
    if user && user.viewer
      errors.add(:layer, "Viewer users can't edit widgets")
      false
    end
  end

  def valid_source_id
    unless source_id.is_a?(String) && source_id =~ /^\w*$/
      errors.add(:source_id, "Source id must be a string")
    end
  end

  def user
    @user ||= layer.nil? ? nil : layer.user
  end
end

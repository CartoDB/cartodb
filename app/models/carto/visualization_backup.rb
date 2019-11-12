require 'active_record'

module Carto
  class VisualizationBackup < ActiveRecord::Base

    # @param Uuid id
    # @param Uuid user_id
    # @param Uuid visualization_id
    # @param DateTime created_at (CURRENT_TIMESTAMP)
    # @param String category
    # @param JSON export

    attr_accessible :id, :user_id, :visualization_id, :category, :export
    validates :user_id, :visualization_id, :category, :export, presence: true
    serialize :export, CartoJsonSymbolizerSerializer
    validates :export, carto_json_symbolizer: true

    CATEGORY_VISUALIZATION = 'visualization'.freeze
    CATEGORY_LAYER = 'layer'.freeze
  end
end

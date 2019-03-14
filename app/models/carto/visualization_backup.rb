# encoding: UTF-8

require 'active_record'

module Carto
  class VisualizationBackup < ActiveRecord::Base

    # @param Uuid id
    # @param Uuid user_id
    # @param Uuid visualization_id
    # @param DateTime created_at (CURRENT_TIMESTAMP)
    # @param String category
    # @param String export

    attr_accessible :id, :user_id, :visualization_id, :category, :export

    validates :user_id, :visualization_id, :category, :export, presence: true

    FEATURE_FLAG_NAME = "visualizations_backup_2"

    CATEGORY_VISUALIZATION = 'visualization'.freeze
    CATEGORY_LAYER = 'layer'.freeze

    VALID_CATEGORIES = [CATEGORY_VISUALIZATION, CATEGORY_LAYER].freeze

  end
end

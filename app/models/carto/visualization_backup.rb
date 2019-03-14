# encoding: UTF-8

require 'active_record'

module Carto
  class VisualizationBackup < ActiveRecord::Base

    # @param Uuid id
    # @param Uuid user_id
    # @param Uuid visualization_id
    # @param DateTime created_at (CURRENT_TIMESTAMP)
    # @param String type
    # @param String export

    attr_accessible :id, :user_id, :visualization_id, :type, :export

    validates :user_id, :visualization_id, :type, :export, presence: true

    FEATURE_FLAG_NAME = "visualizations_backup_2"

    TYPE_VISUALIZATION = 'visualization'.freeze
    TYPE_LAYER = 'layer'.freeze

    VALID_TYPES = [TYPE_VISUALIZATION, TYPE_LAYER].freeze

  end
end

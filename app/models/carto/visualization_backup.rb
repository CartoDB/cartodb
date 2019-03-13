# encoding: UTF-8

require 'active_record'

module Carto
  class VisualizationBackup < ActiveRecord::Base

    # @param Uuid id
    # @param String username
    # @param Uuid visualization
    # @param JSON export
    # @param DateTime created_at (Self-generated)

    TYPE_VISUALIZATION = 'visualization'.freeze
    TYPE_LAYER = 'layer'.freeze

    VALID_TYPES = [TYPE_VISUALIZATION, TYPE_LAYER].freeze

    # Allow mass-setting upon .new
    attr_accessible :username, :visualization, :export_vizjson

    validates :username, :visualization, :export_vizjson, presence: true

  end
end

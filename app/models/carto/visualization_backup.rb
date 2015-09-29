# encoding: UTF-8

require 'active_record'

module Carto
  class VisualizationBackup < ActiveRecord::Base

    # @param String username
    # @param Uuid visualization
    # @param String export_vizjson
    # @param DateTime created_at (Self-generated)

    set_primary_key "visualization"

    validates :username, :visualization, :export_vizjson, presence: true

  end
end

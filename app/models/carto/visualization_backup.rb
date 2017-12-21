# encoding: UTF-8

require 'active_record'

module Carto
  class VisualizationBackup < ActiveRecord::Base

    # @param String username
    # @param Uuid visualization
    # @param String export_vizjson
    # @param DateTime created_at (Self-generated)

    # Allow mass-setting upon .new
    attr_accessible :username, :visualization, :export_vizjson

    validates :username, :visualization, :export_vizjson, presence: true

  end
end

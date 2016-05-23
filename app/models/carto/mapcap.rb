# encoding: utf-8

require_relative '../../services/carto/visualizations_export_service_2'

module Carto
  class Mapcap < ActiveRecord::Base
    include Carto::VisualizationsExportService2Exporter

    before_save :generate_export_vizjson

    def generate_export_vizjson
      vis_id = map.visualizations.first.id
      self.export_vizjson = export_visualization_json_string(vis_id, user)
    end

    def map
      @map ||= Carto::Map.find(map_id)
    end

    def user
      @user ||= Carto::User.find(user_id)
    end
  end
end

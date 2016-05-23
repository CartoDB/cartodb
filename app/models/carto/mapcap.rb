# encoding: utf-8

require_relative '../../services/carto/visualizations_export_service_2'

module Carto
  class Mapcap < ActiveRecord::Base
    include Carto::VisualizationsExportService2Exporter
    include Carto::VisualizationsExportService2Importer

    before_save :generate_export_vizjson

    def generate_export_vizjson
      self.export_vizjson = export_visualization_json_string(visualization.id, user)
    end

    def visualization
      @visualization ||= if export_vizjson
                           build_visualization_from_json_export(export_vizjson)
                         else
                           Carto::Visualization.find(vis_id)
                         end
    end

    private

    def user
      @user ||= Carto::User.find(user_id)
    end
  end
end

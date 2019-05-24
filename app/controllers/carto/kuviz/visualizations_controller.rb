module Carto
  module Kuviz
    class VisualizationsController < ApplicationController
      def show
        kuviz_source = Carto::Asset.find(params[:id])
        return public_map_protected if kuviz_source.visualization.password_protected?
        @source = open(kuviz_source.public_url).read
        render :layout => false
      end

      private

      def kuviz_password_protected
        render 'public_map_password', :layout => 'application_password_layout'
      end
    end
  end
end

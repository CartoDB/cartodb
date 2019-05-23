module Carto
  module Kuviz
    class VisualizationsController < ApplicationController
      def show
        debugger
        kuviz = Carto::Asset.find(params[:id])
        @source = open(kuviz.public_url).read
        render :layout => false
      end
    end
  end
end

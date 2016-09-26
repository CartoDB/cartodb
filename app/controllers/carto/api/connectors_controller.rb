# encoding: utf-8

module Carto
  module Api
    class ConnectorsController < ::Api::ApplicationController

      ssl_required :index, :show

      def index
        render_jsonp(Carto::Connector.providers(current_user))
      end

      def show
        provider_id = params[:provider_id]
        begin
          information = Carto::Connector.information(provider_id)
          render_jsonp(information)
        rescue Carto::Connector::InvalidParametersError
          render_jsonp({ errors: "Provider #{provider_id} unknown" }, 422)
        end
      end
    end
  end
end

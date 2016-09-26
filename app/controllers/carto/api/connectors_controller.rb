# encoding: utf-8

module Carto
  module Api
    class ConnectorsController < ::Api::ApplicationController

      ssl_required :index, :show

      def index
        render_jsonp(Carto::Connector.providers(current_user))
      end
    end
  end
end

#encoding: UTF-8

module Carto
  module Api
    class AssetsController < ::Api::ApplicationController

      ssl_required :index

      def index
        assets = uri_user.assets
        render_jsonp({ 
            total_entries: assets.size, 
            assets: assets.map { |asset| 
                Carto::Api::AssetsPresenter.new(asset).public_values
              }
          })
      end

      private

      # TODO: this should be moved upwards in the controller hierarchy, and make it a replacement for current_user
      # URI present-user if has valid session, or nil
      def uri_user
        @uri_user ||= (current_user.nil? ? nil : Carto::User.where(id: current_user.id).first)
      end

    end
  end
end

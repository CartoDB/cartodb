# require_dependency 'carto/controller_helper'

module Carto
  module Api
    module Public
      class DataObservatoryController < Carto::Api::Public::ApplicationController
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        ssl_required

        before_action :load_user
        before_action :check_permissions

        setup_default_rescues

        respond_to :json

        def token
          response = Cartodb::Central.new.get_do_token(@user.username)
          render(json: response)
        end

        private

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def check_permissions
          api_key = Carto::ApiKey.find_by_token(params["api_key"])
          raise UnauthorizedError unless api_key&.master? || api_key&.data_observatory_permissions?
        end

      end
    end
  end
end

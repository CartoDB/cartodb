module Carto
  module Api
    module Public
      class BigQueryTilesetsController < Carto::Api::Public::ApplicationController

        include Carto::Api::PagedSearcher
        extend Carto::DefaultRescueFroms

        before_action :load_user
        before_action :load_service
        before_action :check_permissions

        setup_default_rescues

        def load_user
          @user = ::User.where(id: current_viewer.id).first
        end

        def load_service
          @service = Carto::BigQueryTilesetsService.new(user: @user)
        end

        def check_permissions
          @api_key = Carto::ApiKey.find_by(params['api_key'])
          raise UnauthorizedError unless @api_key&.master?
          raise UnauthorizedError unless @api_key.user_id.is_a?(@user.id)
        end

        def list_bigquery_tilesets
          result = @service.list_tilesets
          render_jsonp(result, 200)
        end

      end
    end
  end
end

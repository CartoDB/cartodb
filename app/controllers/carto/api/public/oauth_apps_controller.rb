require_relative '../paged_searcher'

module Carto
  module Api
    module Public
      class OauthAppsController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        include Carto::ControllerHelper
        extend Carto::DefaultRescueFroms

        ssl_required

        before_action :load_user
        before_action :load_oauth_app, only: [:show, :update, :destroy]

        setup_default_rescues

        VALID_ORDER_PARAMS = [:name, :updated_at, :restricted, :user_id].freeze

        def index
          page, per_page, order = page_per_page_order_params(VALID_ORDER_PARAMS)
          oauth_apps = user_or_organization_apps
          filtered_oauth_apps = Carto::PagedModel.paged_association(oauth_apps, page, per_page, order)
          result = filtered_oauth_apps.map { |oauth_app| OauthAppPresenter.new(oauth_app).to_poro }

          render_jsonp(
            paged_result(
              result: result,
              total_count: oauth_apps.size,
              page: page,
              per_page: per_page,
              params: params.except('controller', 'action')
            ) { |params| api_keys_url(params) },
            200
          )
        end

        def show
          render_jsonp(OauthAppPresenter.new(@oauth_app).to_poro, 200)
        end

        def create
          create_params = permitted_params.merge(user: @user)
          oauth_app = OauthApp.create!(create_params)
          render_jsonp(OauthAppPresenter.new(oauth_app).to_poro, 201)
        end

        def update
          @oauth_app.update_attributes!(permitted_params)
          render_jsonp(OauthAppPresenter.new(@oauth_app).to_poro, 200)
        end

        def destroy
          @oauth_app.destroy!
          head :no_content
        end

        private

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def load_oauth_app
          @oauth_app = Carto::OauthApp.find(params[:id])
        end

        def user_or_organization_apps
          return @user.oauth_apps unless @user.organization_owner?

          org_users = @user.organization.users
          Carto::OauthApp.where(user: org_users)
        end

        def permitted_params
          params.permit(:name, :icon_url, :restricted, redirect_uris: [])
        end

      end
    end
  end
end

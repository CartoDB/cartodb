require_relative '../paged_searcher'
require_dependency 'carto/oauth_provider/errors'

module Carto
  module Api
    module Public
      class OauthAppsController < Carto::Api::Public::ApplicationController
        include Carto::Api::PagedSearcher
        extend Carto::DefaultRescueFroms

        ssl_required

        before_action :load_user
        before_action :load_owned_app, only: [:show, :update, :regenerate_secret, :destroy]
        before_action :load_granted_app, only: :revoke
        before_action :load_index_params, only: [:index, :index_granted]
        before_action :engine_required

        setup_default_rescues
        rescue_from Carto::OauthProvider::Errors::ServerError, with: :rescue_oauth_errors

        VALID_ORDER_PARAMS = [:name, :updated_at, :restricted, :user_id].freeze

        def index
          oauth_apps = user_or_organization_apps
          render_paged(oauth_apps, private_data: true) { |params| api_v4_oauth_apps_url(params) }
        end

        def index_granted
          oauth_apps = @user.granted_oauth_apps
          render_paged(oauth_apps) { |params| api_v4_oauth_apps_index_granted_url(params) }
        end

        def show
          render_jsonp(OauthAppPresenter.new(@oauth_app).to_hash(private_data: true), 200)
        end

        def create
          create_params = permitted_params.merge(user: @user)
          @oauth_app = OauthApp.create!(create_params)
          track_event('CreatedOauthApp')
          render_jsonp(OauthAppPresenter.new(@oauth_app).to_hash(private_data: true), 201)
        end

        def update
          @oauth_app.update_attributes!(permitted_params)
          render_jsonp(OauthAppPresenter.new(@oauth_app).to_hash(private_data: true), 200)
        end

        def regenerate_secret
          @oauth_app.regenerate_client_secret!
          render_jsonp(OauthAppPresenter.new(@oauth_app.reload).to_hash(private_data: true), 200)
        end

        def destroy
          @oauth_app.destroy!
          track_event('DeletedOauthApp')
          head :no_content
        end

        def revoke
          oauth_app_user = @oauth_app.oauth_app_users.where(user_id: @user.id).first
          oauth_app_user.destroy!
          track_event('DeletedOauthAppUser')
          head :no_content
        end

        private

        def load_user
          @user = Carto::User.find(current_viewer.id)
        end

        def load_owned_app
          @oauth_app = Carto::OauthApp.find(params[:id])
          raise ActiveRecord::RecordNotFound.new unless owned?
        end

        def load_granted_app
          @oauth_app = Carto::OauthApp.find(params[:id])
          raise ActiveRecord::RecordNotFound.new unless granted?
        end

        def owned?
          return true if @oauth_app.user_id == @user.id

          @user.organization_admin? && @user.organization == @oauth_app.user.organization
        end

        def granted?
          @user.granted_oauth_apps.include?(@oauth_app)
        end

        def load_index_params
          @page, @per_page, @order = page_per_page_order_params(VALID_ORDER_PARAMS)
        end

        def user_or_organization_apps
          return @user.oauth_apps unless @user.organization_admin?

          org_users = @user.organization.users
          Carto::OauthApp.where(user: org_users)
        end

        def permitted_params
          params.permit(:name, :icon_url, :description, :website_url, redirect_uris: [])
        end

        def render_paged(oauth_apps, private_data: false)
          filtered_oauth_apps = Carto::PagedModel.paged_association(oauth_apps, @page, @per_page, @order)
          result = filtered_oauth_apps.map do |oauth_app|
            OauthAppPresenter.new(oauth_app, user: @user).to_hash(private_data: private_data)
          end

          enriched_response = paged_result(
            result: result,
            total_count: oauth_apps.size,
            page: @page,
            per_page: @per_page,
            params: params.except('controller', 'action')
          ) { |params| yield(params) }

          render_jsonp(enriched_response, 200)
        end

        def rescue_oauth_errors(exception)
          render json: { errors: exception.parameters[:error_description] }, status: 500
        end

        def track_event(event_name)
          properties = {
            user_id: @user.id,
            app_id: @oauth_app.id,
            app_name: @oauth_app.name
          }
          event_class = "Carto::Tracking::Events::#{event_name}".constantize
          event_class.new(@user.id, properties).report
        end
      end
    end
  end
end

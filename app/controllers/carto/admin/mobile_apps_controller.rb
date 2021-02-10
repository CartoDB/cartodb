require_dependency 'helpers/avatar_helper'
require_dependency 'cartodb/central'
require_dependency 'helpers/organization_notifications_helper'

class Carto::Admin::MobileAppsController < Admin::AdminController
  include MobileAppsHelper
  include AvatarHelper
  include OrganizationNotificationsHelper

  ssl_required  :index, :show, :new, :create, :update, :destroy
  before_filter :invalidate_browser_cache
  before_filter :login_required
  before_filter :check_user_permissions
  before_filter :initialize_cartodb_central_client
  before_filter :load_organization_notifications
  before_filter :validate_id, only: [:show, :update, :destroy]
  before_filter :load_mobile_app, only: [:show, :update]
  before_filter :setup_avatar_upload, only: [:new, :create, :show, :update]

  rescue_from Carto::LoadError, with: :render_404

  layout 'application'

  def index
    response = @cartodb_central_client.get_mobile_apps(current_user.username).deep_symbolize_keys

    @mobile_apps = response[:mobile_apps].map { |a| Carto::MobileApp.new(a) }
    @open_monthly_users = response[:monthly_users][:open]
    @private_monthly_users = response[:monthly_users][:private]
  rescue CartoDB::CentralCommunicationFailure => e
    @mobile_apps = []
    log_error(message: 'Error loading mobile apps from Central', exception: e)
    flash.now[:error] = 'Unable to connect to license server. Try again in a moment.'
  end

  def show
  end

  def new
    @mobile_app = Carto::MobileApp.new
  end

  def create
    @mobile_app = Carto::MobileApp.new(params[:mobile_app])
    @mobile_app.icon_url = get_default_avatar unless @mobile_app.icon_url.present?

    unless @mobile_app.valid?
      flash.now[:error] = @mobile_app.errors.full_messages.join(', ')
      render :new
      return
    end

    attributes = @mobile_app.as_json.symbolize_keys.slice(:name, :description, :icon_url, :platform, :app_id, :app_type)
    @cartodb_central_client.create_mobile_app(current_user.username, attributes)

    redirect_to CartoDB.url(self, 'mobile_apps'), flash: { success: 'Your app has been added succesfully!' }

  rescue CartoDB::CentralCommunicationFailure => e
    if e.response_code == 422
      if e.errors.any? { |e| e['app_id'] }
        @mobile_app.errors["app_id"] = 'has already been taken'
        flash.now[:error] = "That application ID has already been taken. Please make sure that it is unique."
      else
        flash.now[:error] = e.errors.join('. ')
      end
    else
      log_error(message: 'Error creating mobile_app in Central', exception: e)
      flash.now[:error] = 'Unable to connect to license server. Try again in a moment.'
    end
    render :new
  end

  def update
    updated_attributes = params[:mobile_app].symbolize_keys.slice(:name, :description, :icon_url, :app_type)
    @mobile_app.name = updated_attributes[:name]
    @mobile_app.icon_url = updated_attributes[:icon_url]
    @mobile_app.description = updated_attributes[:description]

    unless @mobile_app.valid?
      flash.now[:error] = @mobile_app.errors.full_messages.join(', ')
      render :show
      return
    end

    @cartodb_central_client.update_mobile_app(current_user.username, @app_id, updated_attributes)

    redirect_to(CartoDB.url(self, 'mobile_app', params: { id: @app_id }),
                flash: { success: 'Your app has been updated succesfully!' })

  rescue CartoDB::CentralCommunicationFailure => e
    if e.response_code == 422
      flash.now[:error] = e.errors
    else
      log_error(message: 'Error updating mobile_app in Central', exception: e)
      flash.now[:error] = 'Unable to connect to license server. Try again in a moment.'
    end
    render :show
  end

  def destroy
    valid_password_confirmation
    @cartodb_central_client.delete_mobile_app(current_user.username, @app_id)
    redirect_to CartoDB.url(self, 'mobile_apps'), flash: { success: 'Your app has been deleted succesfully!' }
  rescue Carto::PasswordConfirmationError => e
    flash[:error] = e.message
    redirect_to(CartoDB.url(self, 'mobile_app', params: { id: @app_id }))
  rescue CartoDB::CentralCommunicationFailure => e
    raise Carto::LoadError.new('Mobile app not found') if e.response_code == 404
    log_error(message: 'Error deleting mobile app from Central', exception: e, app_id: @app_id)
    redirect_to(CartoDB.url(self, 'mobile_app', params: { id: @app_id }),
                flash: { error: 'Unable to connect to license server. Try again in a moment.' })
  end

  private

  def check_user_permissions
    raise Carto::LoadError.new('Mobile apps disabled') unless current_user.mobile_sdk_enabled?
  end

  def initialize_cartodb_central_client
    raise(Carto::LoadError, 'Mobile apps disabled') unless Cartodb::Central.api_sync_enabled?

    @cartodb_central_client ||= Cartodb::Central.new
  end

  def validate_id
    @app_id = uuid_parameter(:id)
  end

  def setup_avatar_upload
    @icon_valid_extensions = AVATAR_VALID_EXTENSIONS
  end

  def load_mobile_app
    @mobile_app = Carto::MobileApp.new(@cartodb_central_client.get_mobile_app(current_user.username, @app_id))

  rescue CartoDB::CentralCommunicationFailure => e
    raise Carto::LoadError.new('Mobile app not found') if e.response_code == 404
    log_error(message: 'Error loading mobile app from Central', exception: e, app_id: @app_id)

    redirect_to(CartoDB.url(self, 'mobile_apps'),
                flash: { error: 'Unable to connect to license server. Try again in a moment.' })
  end

  def get_default_avatar
    if Cartodb.asset_path
      "#{Cartodb.asset_path}/assets/unversioned/images/avatars/mobile_app_default_avatar.png"
    else
      "#{relative_url_root}/#{frontend_version}/images/avatars/mobile_app_default_avatar.png"
    end
  end
end

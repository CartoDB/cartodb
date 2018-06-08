# coding: utf-8
require_dependency 'google_plus_api'
require_dependency 'google_plus_config'
require_dependency 'carto/controller_helper'
require_dependency 'dummy_password_generator'

class Admin::OrganizationUsersController < Admin::AdminController
  include OrganizationUsersHelper
  include DummyPasswordGenerator

  # Organization actions
  ssl_required  :new, :create, :edit, :update, :destroy
  # Data of single users
  ssl_required  :profile, :account, :oauth, :api_key, :regenerate_api_key

  before_filter :get_config
  before_filter :login_required, :check_permissions, :load_organization
  before_filter :get_user, only: [:edit, :update, :destroy, :regenerate_api_key]
  before_filter :ensure_edit_permissions, only: [:edit, :update, :destroy, :regenerate_api_key]
  before_filter :initialize_google_plus_config, only: [:edit, :update]

  layout 'application'

  def new
    @user = ::User.new
    @user.quota_in_bytes = [@organization.unassigned_quota, @organization.default_quota_in_bytes].min

    @user.soft_geocoding_limit = current_user.soft_geocoding_limit
    @user.soft_here_isolines_limit = current_user.soft_here_isolines_limit
    @user.soft_obs_snapshot_limit = current_user.soft_obs_snapshot_limit
    @user.soft_obs_general_limit = current_user.soft_obs_general_limit
    @user.soft_twitter_datasource_limit = current_user.soft_twitter_datasource_limit
    @user.soft_mapzen_routing_limit = current_user.soft_mapzen_routing_limit

    @user.viewer = @organization.remaining_seats <= 0 && @organization.remaining_viewer_seats > 0

    respond_to do |format|
      format.html { render 'new' }
    end
  end

  def edit
    set_flash_flags
    respond_to do |format|
      format.html { render 'edit' }
    end
  end

  def create
    @user = ::User.new

    # Validation is done on params to allow checking the change of the value.
    # The error is deferred to display values in the form in the error scenario.
    validation_failure = !soft_limits_validation(@user, params[:user], @organization.owner)

    if !@organization.auth_username_password_enabled &&
       !params[:user][:password].present? &&
       !params[:user][:password_confirmation].present?
      dummy_password = generate_dummy_password
      params[:user][:password] = dummy_password
      params[:user][:password_confirmation] = dummy_password
    end

    @user.set_fields(
      params[:user],
      [
        :username, :email, :password, :quota_in_bytes, :password_confirmation,
        :twitter_datasource_enabled, :soft_geocoding_limit, :soft_here_isolines_limit,
        :soft_obs_snapshot_limit, :soft_obs_general_limit, :soft_mapzen_routing_limit
      ]
    )
    @user.viewer = params[:user][:viewer] == 'true'
    @user.org_admin = params[:user][:org_admin] unless params[:user][:org_admin].nil?
    @user.organization = @organization
    current_user.copy_account_features(@user)

    # Validate password first, so nicer errors are displayed
    model_validation_ok = @user.valid_password?(:password, @user.password, @user.password_confirmation) &&
                          @user.valid_creation?(current_user)

    valid_password_confirmation
    unless model_validation_ok
      raise Sequel::ValidationFailed.new("Validation failed: #{@user.errors.full_messages.join(', ')}")
    end
    raise Carto::UnprocesableEntityError.new("Soft limits validation error") if validation_failure

    @user.save(raise_on_failure: true)
    @user.create_in_central
    common_data_url = CartoDB::Visualization::CommonDataService.build_url(self)
    ::Resque.enqueue(::Resque::UserDBJobs::CommonData::LoadCommonData, @user.id, common_data_url)
    @user.notify_new_organization_user
    @user.organization.notify_if_seat_limit_reached
    CartoGearsApi::Events::EventManager.instance.notify(
      CartoGearsApi::Events::UserCreationEvent.new(
        CartoGearsApi::Events::UserCreationEvent::CREATED_VIA_ORG_ADMIN, @user
      )
    )
    redirect_to CartoDB.url(self, 'organization', {}, current_user), flash: { success: "New user created successfully" }
  rescue Carto::UnprocesableEntityError => e
    CartoDB::Logger.error(exception: e, message: "Validation error")
    set_flash_flags
    flash.now[:error] = e.user_message
    render 'new', status: 422
  rescue CartoDB::CentralCommunicationFailure => e
    CartoDB.report_exception(e)
    begin
      @user.destroy
    rescue => ee
      CartoDB.report_exception(ee)
    end
    set_flash_flags
    flash.now[:error] = e.user_message
    @user = default_user
    render 'new'
  rescue Carto::PasswordConfirmationError => e
    flash.now[:error] = e.message
    render action: 'new', status: e.status
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = e.message
    render 'new'
  end

  def update
    valid_password_confirmation
    session[:show_dashboard_details_flash] = params[:show_dashboard_details_flash].present?
    session[:show_account_settings_flash] = params[:show_account_settings_flash].present?

    # Validation is done on params to allow checking the change of the value.
    # The error is deferred to display values in the form in the error scenario.
    validation_failure = !soft_limits_validation(@user, params[:user])

    attributes = params[:user]
    @user.set_fields(attributes, [:email]) if attributes[:email].present? && !@user.google_sign_in
    @user.set_fields(attributes, [:quota_in_bytes]) if attributes[:quota_in_bytes].present?

    @user.set_fields(attributes, [:disqus_shortname]) if attributes[:disqus_shortname].present?
    @user.set_fields(attributes, [:available_for_hire]) if attributes[:available_for_hire].present?
    @user.set_fields(attributes, [:name]) if attributes[:name].present?
    @user.set_fields(attributes, [:website]) if attributes[:website].present?
    @user.set_fields(attributes, [:description]) if attributes[:description].present?
    @user.set_fields(attributes, [:twitter_username]) if attributes[:twitter_username].present?
    @user.set_fields(attributes, [:location]) if attributes[:location].present?
    @user.set_fields(attributes, [:org_admin]) if attributes[:org_admin].present?

    @user.viewer = attributes[:viewer] == 'true'

    @user.password = attributes[:password] if attributes[:password].present?
    @user.password_confirmation = attributes[:password_confirmation] if attributes[:password_confirmation].present?
    @user.soft_geocoding_limit = attributes[:soft_geocoding_limit] if attributes[:soft_geocoding_limit].present?
    @user.soft_here_isolines_limit = attributes[:soft_here_isolines_limit] if attributes[:soft_here_isolines_limit].present?
    @user.soft_obs_snapshot_limit = attributes[:soft_obs_snapshot_limit] if attributes[:soft_obs_snapshot_limit].present?
    @user.soft_obs_general_limit = attributes[:soft_obs_general_limit] if attributes[:soft_obs_general_limit].present?
    @user.twitter_datasource_enabled = attributes[:twitter_datasource_enabled] if attributes[:twitter_datasource_enabled].present?
    @user.soft_twitter_datasource_limit = attributes[:soft_twitter_datasource_limit] if attributes[:soft_twitter_datasource_limit].present?
    @user.soft_mapzen_routing_limit = attributes[:soft_mapzen_routing_limit] if attributes[:soft_mapzen_routing_limit].present?

    model_validation_ok = @user.valid_update?(current_user)
    if attributes[:password].present? || attributes[:password_confirmation].present?
      model_validation_ok &&= @user.valid_password?(:password, attributes[:password], attributes[:password_confirmation])
    end

    unless model_validation_ok
      raise Sequel::ValidationFailed.new("Validation failed: #{@user.errors.full_messages.join(', ')}")
    end

    raise Carto::UnprocesableEntityError.new("Soft limits validation error") if validation_failure

    # update_in_central is duplicated because we don't wan ta local save if Central fails,
    # but before/after save at user can change some attributes that we also want to persist.
    # Since those callbacks aren't idempotent there's no much better solution without a big refactor.
    @user.update_in_central

    @user.save(raise_on_failure: true)

    @user.update_in_central

    redirect_to CartoDB.url(self, 'edit_organization_user', { id: @user.username }, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue Carto::UnprocesableEntityError => e
    CartoDB::Logger.error(exception: e, message: "Validation error")
    set_flash_flags
    flash.now[:error] = e.user_message
    render 'edit', status: 422
  rescue CartoDB::CentralCommunicationFailure => e
    set_flash_flags
    flash.now[:error] = "There was a problem while updating this user. Please, try again and contact us if the problem persists. #{e.user_message}"
    render 'edit'
  rescue Carto::PasswordConfirmationError => e
    flash.now[:error] = e.message
    render action: 'edit', status: e.status
  rescue Sequel::ValidationFailed => e
    flash.now[:error] = e.message
    render 'edit', status: 422
  end

  def destroy
    valid_password_confirmation
    raise "Can't delete user. Has shared entities" if @user.has_shared_entities?

    @user.destroy
    @user.delete_in_central
    flash[:success] = "User was successfully deleted."
    redirect_to CartoDB.url(self, 'organization', {}, current_user)
  rescue CartoDB::CentralCommunicationFailure => e
    if e.user_message =~ /No organization user found with username/
      flash[:success] = "User was successfully deleted."
      redirect_to CartoDB.url(self, 'organization', {}, current_user)
    else
      CartoDB::Logger.error(exception: e, message: 'Error deleting organizational user from central', target_user: @user.username)
      flash[:success] = "#{e.user_message}. User was deleted from the organization server."
      redirect_to organization_path(user_domain: params[:user_domain])
    end
  rescue Carto::PasswordConfirmationError => e
    flash[:error] = e.message
    redirect_to organization_path(user_domain: params[:user_domain])
  rescue => e
    CartoDB::Logger.error(exception: e, message: 'Error deleting organizational user', target_user: @user.username)
    flash[:error] = "User was not deleted. #{e.message}"
    redirect_to organization_path(user_domain: params[:user_domain])
  end

  def regenerate_api_key
    valid_password_confirmation
    @user.regenerate_all_api_keys
    flash[:success] = "User API key regenerated successfully"
    redirect_to CartoDB.url(self, 'edit_organization_user', { id: @user.username }, current_user), flash: { success: "Your changes have been saved correctly." }
  rescue Carto::PasswordConfirmationError => e
    flash[:error] = e.message
    render action: 'edit', status: e.status
  rescue => e
    CartoDB.notify_exception(e, { user_id: @user.id, current_user: current_user.id })
    flash[:error] = "There was an error regenerating the API key. Please, try again and contact us if the problem persists"
    render 'edit'
  end

  private

  def default_user
    ::User.new(username: @user.username, email: @user.email, quota_in_bytes: @user.quota_in_bytes, twitter_datasource_enabled: @user.twitter_datasource_enabled)
  end

  def extras_enabled?
    extra_geocodings_enabled? || extra_here_isolines_enabled? || extra_obs_snapshot_enabled? || extra_obs_general_enabled? || extra_tweets_enabled?
  end

  def extra_geocodings_enabled?
    !Cartodb.get_config(:geocoder, 'app_id').blank?
  end

  def extra_here_isolines_enabled?
    true
  end

  def extra_obs_snapshot_enabled?
    true
  end

  def extra_obs_general_enabled?
    true
  end

  def extra_tweets_enabled?
    !Cartodb.get_config(:datasource_search, 'twitter_search', 'standard', 'username').blank?
  end

  def set_flash_flags(show_dashboard_details_flash = nil, show_account_settings_flash = nil)
    @show_dashboard_details_flash = session[:show_dashboard_details_flash] || show_dashboard_details_flash
    @show_account_settings_flash = session[:show_account_settings_flash] || show_account_settings_flash
    session[:show_dashboard_details_flash] = nil
    session[:show_account_settings_flash] = nil
  end

  def get_config
    @extras_enabled = extras_enabled?
    @extra_geocodings_enabled = extra_geocodings_enabled?
    @extra_tweets_enabled = extra_tweets_enabled?
  end

  def initialize_google_plus_config
    signup_action = Cartodb::Central.sync_data_with_cartodb_central? ? Cartodb::Central.new.google_signup_url : '/google/signup'
    @google_plus_config = ::GooglePlusConfig.instance(CartoDB, Cartodb.config, signup_action)
  end

  def check_permissions
    raise RecordNotFound unless current_user.organization_admin?
  end

  def get_user
    @user = @organization.users_dataset.where(username: params[:id]).first
    raise RecordNotFound unless @user
  end

  def load_organization
    @organization = current_user.organization
  end

  def ensure_edit_permissions
    render_403 unless @user.editable_by?(current_user)
  end
end

require_dependency 'carto/helpers/batch_queries_statement_timeout'
require_dependency 'carto/helpers/billing'
require_dependency 'carto/helpers/google_maps'
require_dependency 'carto/helpers/has_connector_configuration'
require_dependency 'carto/helpers/limits'
require_dependency 'carto/helpers/multifactor_authentication'
require_dependency 'carto/helpers/oauth_services'
require_dependency 'carto/helpers/password'
require_dependency 'carto/helpers/password_rate_limit'
require_dependency 'carto/helpers/urls'
require_dependency 'carto/helpers/varnish_cache_handler'

module Carto::UserCommons
  include Carto::BatchQueriesStatementTimeout
  include Carto::Billing
  include Carto::GoogleMaps
  include Carto::HasConnectorConfiguration
  include Carto::Limits
  include Carto::MultifactorAuthentication
  include Carto::OauthServices
  include Carto::Password
  include Carto::PasswordRateLimit
  include Carto::Urls
  include Carto::VarnishCacheHandler

  STATE_ACTIVE = 'active'.freeze
  STATE_LOCKED = 'locked'.freeze

  # Make sure the following date is after Jan 29, 2015,
  # which is the date where a message to accept the Terms and
  # conditions and the Privacy policy was included in the Signup page.
  # See https://github.com/CartoDB/cartodb-central/commit/3627da19f071c8fdd1604ddc03fb21ab8a6dff9f
  FULLSTORY_ENABLED_MIN_DATE = Date.new(2017, 1, 1)

  #                             +--------+---------+------+
  #       valid_privacy logic   | Public | Private | Link |
  #   +-------------------------+--------+---------+------+
  #   | private_tables_enabled  |    T   |    T    |   T  |
  #   | !private_tables_enabled |    T   |    F    |   F  |
  #   +-------------------------+--------+---------+------+
  #
  def valid_privacy?(privacy)
    private_tables_enabled || privacy == Carto::UserTable::PRIVACY_PUBLIC
  end

  def twitter_configured?
    # DatasourcesFactory.config_for takes configuration from organization if user is an organization user
    CartoDB::Datasources::DatasourcesFactory.customized_config?(Search::Twitter::DATASOURCE_NAME, self)
  end

  def oauth_signin?
    google_sign_in || github_user_id.present?
  end

  def created_with_http_authentication?
    Carto::UserCreation.http_authentication.find_by_user_id(id).present?
  end

  def database_public_username
    database_schema == CartoDB::DEFAULT_DB_SCHEMA ? CartoDB::PUBLIC_DB_USER : "cartodb_publicuser_#{id}"
  end

  # Gets the list of OAuth accounts the user has (currently only used for synchronization)
  # @return CartoDB::OAuths
  def oauths
    @oauths ||= CartoDB::OAuths.new(self)
  end

  def remaining_days_deletion
    return nil unless state == STATE_LOCKED

    begin
      deletion_date = Cartodb::Central.new.get_user(username).fetch('scheduled_deletion_date', nil)
      return nil unless deletion_date

      (deletion_date.to_date - Date.today).to_i
    rescue StandardError => e
      message = 'Something went wrong calculating the number of remaining days for account deletion'
      CartoDB::Logger.warning(exception: e, message: message)
      return nil
    end
  end

  def remove_logo?
    has_organization? ? organization.no_map_logo : no_map_logo
  end

  def viewable_by?(viewer)
    id == viewer.id || organization.try(:admin?, viewer)
  end

  def editable_by?(user)
    id == user.id || user.belongs_to_organization?(organization) && (user.organization_owner? || !organization_admin?)
  end

  # create the core user_metadata key that is used in redis
  def key
    "rails:users:#{username}"
  end

  def timeout_key
    "limits:timeout:#{username}"
  end

  def get_auth_tokens
    tokens = [get_auth_token]

    if has_organization?
      tokens << organization.get_auth_token
      tokens += groups.map(&:get_auth_token)
    end

    tokens
  end

  def can_change_email?
    (!google_sign_in || last_password_change_date.present?) && !Carto::Ldap::Manager.new.configuration_present?
  end

  def cant_be_deleted_reason
    if organization_owner?
      "You can't delete your account because you are admin of an organization"
    elsif Carto::UserCreation.http_authentication.where(user_id: id).first.present?
      "You can't delete your account because you are using HTTP Header Authentication"
    end
  end

  def remaining_quota(db_size = db_size_in_bytes)
    return nil unless db_size

    quota_in_bytes - db_size
  end

  def remaining_table_quota
    if table_quota.present?
      remaining = table_quota - table_count
      remaining.negative? ? 0 : remaining
    end
  end

  def organization_user?
    organization.present?
  end
  alias_method :has_organization?, :organization_user?

  def organization_owner?
    organization_user? && organization.owner_id == id
  end

  def organization_admin?
    organization_user? && (organization_owner? || org_admin)
  end

  def belongs_to_organization?(org)
    organization_user? && organization_id == org&.id
  end

  def sql_safe_database_schema
    database_schema.include?('-') ? "\"#{database_schema}\"" : database_schema
  end

  def name_or_username
    name.present? || last_name.present? ? [name, last_name].select(&:present?).join(' ') : username
  end

  def mobile_sdk_enabled?
    private_apps_enabled? || open_apps_enabled?
  end

  def private_apps_enabled?
    mobile_max_private_users.positive?
  end

  def open_apps_enabled?
    mobile_max_open_users.positive?
  end

  def builder?
    !viewer?
  end

  def viewer?
    viewer
  end

  def builder_enabled?
    if has_organization? && builder_enabled.nil?
      organization.builder_enabled
    else
      !!builder_enabled
    end
  end

  def engine_enabled?
    if has_organization? && engine_enabled.nil?
      organization.engine_enabled
    else
      !!engine_enabled
    end
  end

  def new_visualizations_version
    builder_enabled? ? 3 : 2
  end

  def relevant_frontend_version
    frontend_version || CartoDB::Application.frontend_version
  end

  def active?
    state == STATE_ACTIVE
  end

  def locked?
    state == STATE_LOCKED
  end

  def maintenance_mode?
    maintenance_mode == true
  end

  def fullstory_enabled?
    Carto::AccountType::FULLSTORY_SUPPORTED_PLANS.include?(account_type) && created_at > FULLSTORY_ENABLED_MIN_DATE
  end

  def get_database_roles
    api_key_roles = api_keys.reject { |k| k.db_role =~ /^publicuser/ }.map(&:db_role)
    oauth_app_owner_roles = api_keys.reject { |k| k.effective_ownership_role_name == nil }.map(&:effective_ownership_role_name)
    (api_key_roles + oauth_app_owner_roles).uniq
  end

  def make_token
    Carto::Common::EncryptionService.make_token
  end

  def role_display
    viewer ? 'viewer' : 'builder'
  end
end

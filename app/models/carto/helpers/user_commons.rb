module Carto::UserCommons
  OAUTH_SERVICE_TITLES = {
    'gdrive' => 'Google Drive',
    'dropbox' => 'Dropbox',
    'box' => 'Box',
    'mailchimp' => 'MailChimp',
    'instagram' => 'Instagram',
    'bigquery' => 'Google BigQuery'
  }.freeze

  OAUTH_SERVICE_REVOKE_URLS = {
    'mailchimp' => 'http://admin.mailchimp.com/account/oauth2/',
    'instagram' => 'http://instagram.com/accounts/manage_access/'
  }.freeze

  # Make sure the following date is after Jan 29, 2015,
  # which is the date where a message to accept the Terms and
  # conditions and the Privacy policy was included in the Signup page.
  # See https://github.com/CartoDB/cartodb-central/commit/3627da19f071c8fdd1604ddc03fb21ab8a6dff9f
  FULLSTORY_ENABLED_MIN_DATE = Date.new(2017, 1, 1)

  STATE_ACTIVE = 'active'.freeze
  STATE_LOCKED = 'locked'.freeze

  MULTIFACTOR_AUTHENTICATION_ENABLED = 'enabled'.freeze
  MULTIFACTOR_AUTHENTICATION_DISABLED = 'disabled'.freeze
  MULTIFACTOR_AUTHENTICATION_NEEDS_SETUP = 'setup'.freeze

  LOGIN_NOT_RATE_LIMITED = -1

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

  def valid_password?(key, value, confirmation_value)
    password_validator.validate(value, confirmation_value, self).each { |e| errors.add(key, e) }
    validate_password_not_in_use(nil, value, key)

    errors[key].empty?
  end

  def password_validator
    if organization.try(:strong_passwords_enabled)
      Carto::PasswordValidator.new(Carto::StrongPasswordStrategy.new)
    else
      Carto::PasswordValidator.new(Carto::StandardPasswordStrategy.new)
    end
  end

  def validate_password_not_in_use(old_password = nil, new_password = nil, key = :new_password)
    if password_in_use?(old_password, new_password)
      errors.add(key, 'New password cannot be the same as old password')
    end
    errors[key].empty?
  end

  def validate_old_password(old_password)
    return true unless needs_password_confirmation?

    Carto::Common::EncryptionService.verify(password: old_password, secure_password: crypted_password,
                                            secret: Cartodb.config[:password_secret])
  end

  def valid_password_confirmation(password)
    valid = validate_old_password(password)
    errors.add(:password, 'Confirmation password sent does not match your current password') unless valid
    valid
  end

  # Some operations, such as user deletion, won't ask for password confirmation if password is not set
  # (because of Google/Github sign in, for example)
  def needs_password_confirmation?
    (!oauth_signin? || last_password_change_date.present?) &&
      !created_with_http_authentication? &&
      !organization.try(:auth_saml_enabled?)
  end

  def password_expired?
    return false unless password_expiration_in_d && password_set?

    password_date + password_expiration_in_d.days.to_i < Time.now
  end

  def password_expiration_in_d
    organization_user? ? organization.password_expiration_in_d : Cartodb.get_config(:passwords, 'expiration_in_d')
  end

  def password_date
    last_password_change_date || created_at
  end

  def security_token
    return if session_salt.blank?

    Carto::Common::EncryptionService.encrypt(sha_class: Digest::SHA256, password: crypted_password, salt: session_salt)
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

  def avatar
    avatar_url || "//#{default_avatar}"
  end

  # Gets the list of OAuth accounts the user has (currently only used for synchronization)
  # @return CartoDB::OAuths
  def oauths
    @oauths ||= CartoDB::OAuths.new(self)
  end

  def trial_ends_at
    return nil unless Carto::AccountType::TRIAL_PLANS.include?(account_type)

    trial_days = Carto::AccountType::TRIAL_DAYS[account_type].days
    created_at + trial_days
  end

  def remaining_trial_days
    return 0 if trial_ends_at.nil? || trial_ends_at < Time.now

    ((trial_ends_at - Time.now) / 1.day).ceil
  end

  def show_trial_reminder?
    return false unless trial_ends_at

    trial_ends_at > Time.now
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

  def soft_geocoding_limit?
    Carto::AccountType.new.soft_geocoding_limit?(self)
  end
  alias_method :soft_geocoding_limit, :soft_geocoding_limit?

  def hard_geocoding_limit?
    !soft_geocoding_limit?
  end
  alias_method :hard_geocoding_limit, :hard_geocoding_limit?

  def soft_here_isolines_limit?
    Carto::AccountType.new.soft_here_isolines_limit?(self)
  end
  alias_method :soft_here_isolines_limit, :soft_here_isolines_limit?

  def hard_here_isolines_limit?
    !soft_here_isolines_limit?
  end
  alias_method :hard_here_isolines_limit, :hard_here_isolines_limit?

  def soft_obs_snapshot_limit?
    Carto::AccountType.new.soft_obs_snapshot_limit?(self)
  end
  alias_method :soft_obs_snapshot_limit, :soft_obs_snapshot_limit?

  def hard_obs_snapshot_limit?
    !soft_obs_snapshot_limit?
  end
  alias_method :hard_obs_snapshot_limit, :hard_obs_snapshot_limit?

  def soft_obs_general_limit?
    Carto::AccountType.new.soft_obs_general_limit?(self)
  end
  alias_method :soft_obs_general_limit, :soft_obs_general_limit?

  def hard_obs_general_limit?
    !soft_obs_general_limit?
  end
  alias_method :hard_obs_general_limit, :hard_obs_general_limit?

  def soft_twitter_datasource_limit?
    soft_twitter_datasource_limit == true
  end

  def hard_twitter_datasource_limit?
    !soft_twitter_datasource_limit?
  end
  alias_method :hard_twitter_datasource_limit, :hard_twitter_datasource_limit?

  def soft_mapzen_routing_limit?
    Carto::AccountType.new.soft_mapzen_routing_limit?(self)
  end
  alias_method :soft_mapzen_routing_limit, :soft_mapzen_routing_limit?

  def hard_mapzen_routing_limit?
    !soft_mapzen_routing_limit?
  end
  alias_method :hard_mapzen_routing_limit, :hard_mapzen_routing_limit?

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

  def rate_limit_password_key
    "limits:password:#{username}"
  end

  def password_rate_limit_configured?
    @max_burst ||= Cartodb.get_config(:passwords, 'rate_limit', 'max_burst')
    @count ||= Cartodb.get_config(:passwords, 'rate_limit', 'count')
    @period ||= Cartodb.get_config(:passwords, 'rate_limit', 'period')

    [@max_burst, @count, @period].all?(&:present?)
  end

  def password_login_attempt
    return LOGIN_NOT_RATE_LIMITED unless password_rate_limit_configured?

    rate_limit = $users_metadata.call('CL.THROTTLE', rate_limit_password_key, @max_burst, @count, @period)

    # it returns the number of seconds until the user should retry
    # -1 means the action was allowed
    # see https://github.com/brandur/redis-cell#response
    rate_limit[3]
  end

  def reset_password_rate_limit
    $users_metadata.DEL rate_limit_password_key if password_rate_limit_configured?
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

  def can_change_password?
    !Carto::Ldap::Manager.new.configuration_present?
  end

  def cant_be_deleted_reason
    if organization_owner?
      "You can't delete your account because you are admin of an organization"
    elsif Carto::UserCreation.http_authentication.where(user_id: id).first.present?
      "You can't delete your account because you are using HTTP Header Authentication"
    end
  end

  def get_oauth_services
    datasources = CartoDB::Datasources::DatasourcesFactory.get_all_oauth_datasources
    array = []

    datasources.each do |serv|
      obj ||= Hash.new

      title = OAUTH_SERVICE_TITLES.fetch(serv, serv)
      revoke_url = OAUTH_SERVICE_REVOKE_URLS.fetch(serv, nil)
      enabled = case serv
                when 'gdrive'
                  Cartodb.get_config(:oauth, serv, 'client_id')
                when 'box'
                  Cartodb.get_config(:oauth, serv, 'client_id')
                when 'dropbox'
                  Cartodb.get_config(:oauth, serv, 'app_key')
                when 'mailchimp'
                  Cartodb.get_config(:oauth, serv, 'app_key') && has_feature_flag?('mailchimp_import')
                when 'instagram'
                  Cartodb.get_config(:oauth, serv, 'app_key') && has_feature_flag?('instagram_import')
                when 'bigquery'
                  Cartodb.get_config(:oauth, serv, 'client_id') &&
                  Carto::Connector.provider_available?('bigquery', self)
                else
                  true
                end

      if enabled
        oauth = oauths.select(serv)

        obj['name'] = serv
        obj['title'] = title
        obj['revoke_url'] = revoke_url
        obj['connected'] = !oauth.nil? ? true : false

        array.push(obj)
      end
    end

    array
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
    organization&.owner_id == id
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

  def account_url(request_protocol)
    request_protocol + CartoDB.account_host + CartoDB.account_path + '/' + username if CartoDB.account_host
  end

  def plan_url(request_protocol)
    account_url(request_protocol) + '/plan'
  end

  def update_payment_url(request_protocol)
    account_url(request_protocol) + '/update_payment'
  end

  def upgrade_url(request_protocol)
    cartodb_com_hosted? ? '' : (account_url(request_protocol) + '/upgrade')
  end

  def subdomain
    if CartoDB.subdomainless_urls?
      username
    else
      organization.nil? ? username : organization.name
    end
  end

  # returns public user url, which is also the base url for a given user
  def public_url(subdomain_override = nil, protocol_override = nil)
    base_subdomain = subdomain_override.nil? ? subdomain : subdomain_override
    CartoDB.base_url(base_subdomain, CartoDB.organization_username(self), protocol_override)
  end

  def name_or_username
    name.present? || last_name.present? ? [name, last_name].select(&:present?).join(' ') : username
  end

  def google_maps_api_key
    organization&.google_maps_key.presence || google_maps_key
  end

  # TODO: this is the correct name for what's stored in the model, refactor changing that name
  alias_method :google_maps_query_string, :google_maps_api_key

  def google_maps_geocoder_enabled?
    google_maps_private_key.present? && google_maps_client_id.present?
  end

  def google_maps_client_id
    Rack::Utils.parse_nested_query(google_maps_query_string)['client'] if google_maps_query_string
  end

  def basemaps
    (Cartodb.config[:basemaps] || []).select { |group| group != 'GMaps' || google_maps_enabled? }
  end

  def google_maps_enabled?
    google_maps_query_string.present?
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

  def multifactor_authentication_configured?
    user_multifactor_auths.any?
  end

  def active_multifactor_authentication
    user_multifactor_auths.order(created_at: :desc).first
  end

  def multifactor_authentication_status
    if user_multifactor_auths.setup.any?
      MULTIFACTOR_AUTHENTICATION_NEEDS_SETUP
    elsif user_multifactor_auths.enabled.any?
      MULTIFACTOR_AUTHENTICATION_ENABLED
    else
      MULTIFACTOR_AUTHENTICATION_DISABLED
    end
  end

  def get_database_roles
    api_key_roles = api_keys.reject { |k| k.db_role =~ /^publicuser/ }.map(&:db_role)
    oauth_app_owner_roles = api_keys.reject { |k| k.effective_ownership_role_name == nil }.map(&:effective_ownership_role_name)
    (api_key_roles + oauth_app_owner_roles).uniq
  end

  def make_token
    Carto::Common::EncryptionService.make_token
  end
end

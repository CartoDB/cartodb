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
end

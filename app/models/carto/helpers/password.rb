module Carto::Password
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

  def can_change_password?
    !Carto::Ldap::Manager.new.configuration_present?
  end

  def password=(value)
    return if !Carto::Ldap::Manager.new.configuration_present? && !valid_password?(:password, value, value)
    return if !value.nil? && password_validator.validate(value, value, self).any?

    @password = value
    self.crypted_password = Carto::Common::EncryptionService.encrypt(password: value,
                                                                     secret: Cartodb.config[:password_secret])
    set_last_password_change_date
  end

  def password_confirmation=(password_confirmation)
    set_last_password_change_date
    @password_confirmation = password_confirmation
  end

  private

  def set_last_password_change_date
    self.last_password_change_date = Time.zone.now unless new_record?
  end
end

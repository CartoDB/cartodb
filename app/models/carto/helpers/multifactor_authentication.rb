module Carto::MultifactorAuthentication
  MULTIFACTOR_AUTHENTICATION_ENABLED = 'enabled'.freeze
  MULTIFACTOR_AUTHENTICATION_DISABLED = 'disabled'.freeze
  MULTIFACTOR_AUTHENTICATION_NEEDS_SETUP = 'setup'.freeze

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
end

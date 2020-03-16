module Carto::PasswordRateLimit
  LOGIN_NOT_RATE_LIMITED = -1

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
end

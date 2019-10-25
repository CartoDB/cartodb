module DatabaseConnectionHelper
  def with_connection(options)
    connection = ::Sequel.connect(options)
    begin
      yield connection
    ensure
      connection.disconnect
    end
  end

  def with_connection_from_user(user, &block)
    options = ::SequelRails.configuration.environment_for(Rails.env).merge(
      'database' => user.database_name,
      'username' => user.database_username,
      'password' => user.database_password,
      'host' => user.database_host
    )
    with_connection options, &block
  end

  def with_connection_from_api_key(api_key, &block)
    user = api_key.user
    options = ::SequelRails.configuration.environment_for(Rails.env).merge(
      'database' => user.database_name,
      'username' => api_key.db_role,
      'password' => api_key.db_password,
      'host' => user.database_host
    )
    with_connection options, &block
  end
end

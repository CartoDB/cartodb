class RedisFactory
  # db_id: configuration databases entry key (:tables_metadata, :api_credentials...)
  def self.new_connection(db_id: nil)
    configuration = get_conf
    configuration[:db] = databases[db_id] if db_id.present?
    Redis.new(configuration)
  end

  def self.get_conf
    # TODO: because of #8439 we're testing different Redis timeouts for connection, R and W.
    # After getting a final solution timeout configuration should be read from the file again
    redis_conf = conf.select do |k, _|
      [:host, :port, :driver, :tcp_keepalive, :timeout, :connect_timeout, :read_timeout, :write_timeout].include?(k)
    end

    if ENV['REDIS_PORT']
      redis_conf[:port] = ENV['REDIS_PORT']
    end

    if redis_conf[:tcp_keepalive] && redis_conf[:tcp_keepalive].is_a?(Hash)
      redis_conf[:tcp_keepalive] = redis_conf[:tcp_keepalive].symbolize_keys
    end
    if redis_conf[:driver] && redis_conf[:driver].is_a?(String)
      redis_conf[:driver] = redis_conf[:driver].to_sym
    end

    redis_conf
  end

  def self.databases
    if conf[:databases].blank?
      @@default_databases
    else
      conf[:databases].symbolize_keys
    end
  end

  @@default_databases = {
    tables_metadata:     0,
    api_credentials:     3,
    users_metadata:      5,
    redis_migrator_logs: 6
  }.freeze

  def self.conf
    # Note that `symbolize_keys` creates a new instance, which is relevant to avoid side effects
    Cartodb.config[:redis].symbolize_keys
  end

  private_class_method :conf
  private_class_method :get_conf
  private_class_method :databases
end

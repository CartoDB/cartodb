if Cartodb.config[:redis].blank?
  raise <<-MESSAGE
Please, configure Redis in your config/app_config.yml file as this:
  development:
    ...
    redis:
      host: '127.0.0.1'
      port: 6379
MESSAGE
end

# Redis interfaces definition:
conf = Cartodb.config[:redis].symbolize_keys
redis_conf = conf.select { |k, v| [:host, :port].include?(k) }
conf[:databases].each do |k, v|
  begin
    eval("$#{k} = Redis.new(redis_conf.merge(db: #{v}))")
    eval("$#{k}.ping")
  rescue => e
    raise "Error when setting up Redis database #{k}. #{e}"
  end
end

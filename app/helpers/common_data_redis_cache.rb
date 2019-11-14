require 'redis'
require 'json'

class CommonDataRedisCache

  # This needs to be changed whenever there're changes in the code that require invalidation of old keys
  VERSION = '1'

  def initialize(redis_cache = $tables_metadata)
    @redis = redis_cache
  end

  def get(is_https_request)
    key = key(is_https_request)
    value = redis.get(key)
    if value.present?
      return JSON.parse(value, symbolize_names: true)
    else
      return nil
    end
  rescue Redis::BaseError => exception
    CartoDB.notify_exception(exception, { key: key })
    nil
  end

  def set(is_https_request, response_headers, response_body)
    serialized = JSON.generate({headers: response_headers,
                                body: response_body.force_encoding('utf-8')
                               })
    redis.setex(key(is_https_request), 6.hours.to_i, serialized)
  rescue Redis::BaseError => exception
    CartoDB.notify_exception(exception, { key: key, headers: response_headers, body: response_body })
    nil
  end

  def invalidate
    redis.del [key(is_https_request=true), key(is_https_request=false)]
  rescue Redis::BaseError => exception
    CartoDB.notify_exception(exception)
    nil
  end

  def key(is_https_request=false)
    protocol = is_https_request ? 'https' : 'http'
    "common_data:request:#{protocol}:#{VERSION}"
  end

  private

  def redis
    @redis
  end

end

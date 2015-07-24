# encoding: utf-8

class EmbedRedisCache

  # This needs to be changed whenever there're changes in the code that require invalidation of old keys
  VERSION = '2'


  def initialize(redis_cache = $tables_metadata)
    @redis = redis_cache
  end

  def get(visualization_id, https_request)
    key = key(visualization_id, https_request)
    value = redis.get(key)
    if value.present?
      return JSON.parse(value, symbolize_names: true)
    else
      return nil
    end
  rescue Redis::BaseError => exception
    Rollbar.report_exception(exception)
    nil
  end

  # Only public and public with link
  def set(visualization_id, https_request, response_headers, response_body)
    serialized = JSON.generate({headers: response_headers,
                                body: response_body
                               })
    redis.setex(key(visualization_id, https_request), 24.hours.to_i, serialized)
  rescue Redis::BaseError => exception
    Rollbar.report_exception(exception)
    nil
  end

  def invalidate(visualization_id)
    redis.del [key(visualization_id, https_request=true), key(visualization_id, https_request=false)]
  rescue Redis::BaseError => exception
    Rollbar.report_exception(exception)
    nil
  end

  def key(visualization_id, https_request=false)
    protocol = https_request ? 'https' : 'http' 
    "visualization:#{visualization_id}:embed:#{protocol}:#{VERSION}"
  end

  def purge(vizs)
    return unless vizs.count > 0
    keys = vizs.map {|v| [key(v.id, false), key(v.id, true)]}.flatten
    redis.del keys
  end


  private

  def redis
    @redis
  end

end

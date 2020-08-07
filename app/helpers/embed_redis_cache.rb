require 'zlib'

class EmbedRedisCache
  include ::LoggerHelper
  # This needs to be changed whenever there're changes in the code that require invalidation of old keys
  VERSION = '4'

  def initialize(redis_cache = $tables_metadata)
    @redis = redis_cache
  end

  def get(visualization_id, https_request)
    key = key(visualization_id, https_request)
    value = redis.get(key)
    value.present? ? JSON.parse(value, symbolize_names: true) : nil
  rescue StandardError => exception
    # Captures:
    # - Redis::BaseError if redis is down
    # - IO errors due to deploys changing physical path (see read_frontend_version / calculate_embed_template_hash)
    log_error(exception: exception)
    nil
  end

  # Only public and public with link
  def set(visualization_id, https_request, response_headers, response_body)
    serialized = JSON.generate(headers: response_headers,
                               body: response_body
                              )
    redis.setex(key(visualization_id, https_request), 24.hours.to_i, serialized)
  rescue StandardError => exception
    # Captures:
    # - Redis::BaseError if redis is down
    # - IO errors due to deploys changing physical path (see read_frontend_version / calculate_embed_template_hash)
    log_error(exception: exception)
    nil
  end

  def invalidate(visualization_id)
    redis.del [key(visualization_id, true), key(visualization_id, false)]
  rescue StandardError => exception
    # Captures:
    # - Redis::BaseError if redis is down
    # - IO errors due to deploys changing physical path (see read_frontend_version / calculate_embed_template_hash)
    log_error(exception: exception)
    nil
  end

  def key(visualization_id, https_request = false)
    protocol = https_request ? 'https' : 'http'
    [
      "vis",
      visualization_id,
      "embed",
      protocol,
      VERSION,
      CartoDB::Application.frontend_version,
      embed_template_hash
    ].join(":")
  end

  def purge(vizs)
    return unless vizs.count > 0
    keys = vizs.map { |v| [key(v.id, false), key(v.id, true)] }.flatten
    redis.del keys
  end

  private

  def embed_template_hash
    # INFO: New deploys restart the server, invalidating this value + we want to hit disk as less as possible
    @@key_fragment_embed_template_hash ||= calculate_embed_template_hash
  end

  def calculate_embed_template_hash
    # The alternative Adler-32 is not as reliable as CRC32
    # and even less with inputs of "few hundred bytes" as is this case
    Zlib::crc32(File.read(Rails.root.join("app/views/admin/visualizations/embed_map.html.erb")))
  end

  def redis
    @redis
  end

end

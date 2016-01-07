require_relative './metrics_redis_repository'

module CartoDB
  class GeocoderMetricsError < StandardError; end
  class GeocoderMetrics

    SUCCESSFUL_RESPONSE_TYPE = "successful_response"
    FAILED_RESPONSE_TYPE = "failed_response"
    EMPTY_RESPONSE_TYPE = "empty_response"
    TOTAL_RESPONSE_TYPE = "total_requests"
    CACHE_HITS_TYPE = "cache_hits"
    CACHE_MISS_TYPE = "cache_miss"

    ALLOWED_TYPES = %W(#{SUCCESSFUL_RESPONSE_TYPE} #{FAILED_RESPONSE_TYPE} #{EMPTY_RESPONSE_TYPE}
      #{TOTAL_RESPONSE_TYPE} #{CACHE_HITS_TYPE} #{CACHE_MISS_TYPE})

    def initialize(user, geocoder_type)
      @user = user
      @geocoder_type = geocoder_type
      @metrics_repository = CartoDB::MetricsRedisRepository.instance
    end

    def add_responses(type, key, value)
      raise GeocoderMetricsError, "Not a valid geocoder metric type" if  not check_valid_type(type)
      prefix = build_key_prefix(type)
      @metrics_repository.store(prefix, key, value)
    end

    def get_responses(type, key)
      raise NotImplementedError, "Not working yet"
    end

    private

    def check_valid_type(type)
      ALLOWED_TYPES.include?(type)
    end

    def build_key_prefix(type)
      if @user.organization_user?
        orgname = @user.organization.name
        %{org:#{orgname}:#{@user.username}:#{@geocoder_type}:#{type}}
      else
        %{user:#{@user.username}:#{@geocoder_type}:#{type}}
      end
    end

  end
end

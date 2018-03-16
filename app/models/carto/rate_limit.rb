# encoding: utf-8

module Carto
  class RateLimit < ActiveRecord::Base

    RATE_LIMIT_ATTRIBUTES = [:maps_anonymous,
                             :maps_static,
                             :maps_static_named,
                             :maps_dataview,
                             :maps_dataview_search,
                             :maps_analysis,
                             :maps_tile,
                             :maps_attributes,
                             :maps_named_list,
                             :maps_named_create,
                             :maps_named_get,
                             :maps_named,
                             :maps_named_update,
                             :maps_named_delete,
                             :maps_named_tiles,
                             :maps_analysis_catalog,
                             :sql_query,
                             :sql_query_format,
                             :sql_job_create,
                             :sql_job_get,
                             :sql_job_delete].freeze

    RATE_LIMIT_ATTRIBUTES.each { |attr| serialize attr, RateLimitValues }
    RATE_LIMIT_ATTRIBUTES.each { |attr| validates attr, presence: true }

    def self.from_api_attributes(attributes)
      rate_limit = RateLimit.new
      rate_limit.rate_limit_attributes(attributes).each { |k, v| rate_limit[k] = RateLimitValues.new(v) }
      rate_limit
    end

    def to_redis
      result = {}
      RATE_LIMIT_ATTRIBUTES.each do |key|
        result[key.to_s.sub('_', ':')] = self[key].to_redis_array
      end
      result
    end

    def save_to_redis(user)
      raise ActiveRecord::RecordInvalid.new(self) unless valid?
      to_redis.each do |key, value|
        $limits_metadata.DEL "limits:rate:store:#{user.username}:#{key}"
        $limits_metadata.RPUSH "limits:rate:store:#{user.username}:#{key}", value
      end
    end

    def api_attributes
      RATE_LIMIT_ATTRIBUTES.map { |attr| [attr.to_sym, self[attr].to_array] }.to_h
    end

    def destroy_completely(user)
      destroy
      delete_from_redis(user)
    end

    def delete_from_redis(user)
      to_redis.each_key do |key|
        $limits_metadata.DEL "limits:rate:store:#{user.username}:#{key}"
      end
    end

    def rate_limit_attributes(attrs = attributes)
      attrs.with_indifferent_access.slice(*Carto::RateLimit::RATE_LIMIT_ATTRIBUTES)
    end

    def ==(rate_limit)
      super(rate_limit) ||
        rate_limit_attributes.lazy.zip(rate_limit.rate_limit_attributes).all? do |x, y|
          x == y
        end
    end
  end
end

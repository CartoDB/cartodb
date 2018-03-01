# encoding: utf-8

module Carto
  class RateLimit < ActiveRecord::Base

    RATE_LIMIT_ATTRIBUTES = [:maps_anonymous,
                             :maps_static,
                             :maps_static_named,
                             :maps_dataview,
                             :maps_analysis,
                             :maps_tile,
                             :maps_attributes,
                             :maps_named_list,
                             :maps_named_create,
                             :maps_named_get,
                             :maps_named,
                             :maps_named_update,
                             :maps_named_delete,
                             :maps_named_tiles].freeze

    RATE_LIMIT_ATTRIBUTES.each { |attr| serialize attr, RateLimitValues }

    before_create :fix_rate_limit_values_for_insert

    def to_redis
      result = {}
      RATE_LIMIT_ATTRIBUTES.each do |key|
        result[key.to_s.sub('_', ':')] = self[key].to_redis_array
      end
      result
    end

    def save_to_redis(user)
      to_redis.each do |key, value|
        $limits_metadata.DEL "limits:rate:store:#{user.username}:#{key}"
        $limits_metadata.RPUSH "limits:rate:store:#{user.username}:#{key}", value
      end
    end

    private

    def fix_rate_limit_values_for_insert
      RATE_LIMIT_ATTRIBUTES.each do |key|
        value = self[key]
        self[key] = Carto::InsertableArray.new(value) if value
      end
    end
  end
end

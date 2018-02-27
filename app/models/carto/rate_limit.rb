# encoding: utf-8

module Carto
  class RateLimit < ActiveRecord::Base

    serialize :maps_anonymous, RateLimitValues
    serialize :maps_static, RateLimitValues
    serialize :maps_static_named, RateLimitValues
    serialize :maps_dataview, RateLimitValues
    serialize :maps_analysis, RateLimitValues
    serialize :maps_tile, RateLimitValues
    serialize :maps_attributes, RateLimitValues
    serialize :maps_named_list, RateLimitValues
    serialize :maps_named_create, RateLimitValues
    serialize :maps_named_get, RateLimitValues
    serialize :maps_named, RateLimitValues
    serialize :maps_named_update, RateLimitValues
    serialize :maps_named_delete, RateLimitValues
    serialize :maps_named_tiles, RateLimitValues

    before_create :fix_rate_limit_values_for_insert

    RATE_LIMITS_APPS = ['maps', 'sql'].freeze

    def to_redis
      result = {}
      attribute_names.each do |key|
        if rate_limit_attribute?(key)
          result[key.sub('_', ':')] = self[key].to_redis_array
        end
      end
      result
    end

    private

    def fix_rate_limit_values_for_insert
      attribute_names.each do |key|
        value = self[key]
        self[key] = Carto::InsertableArray.new(value) if value && rate_limit_attribute?(key)
      end
    end

    def rate_limit_attribute?(attribute_name)
      return false if attribute_name.nil?

      key = attribute_name.split('_').first
      RATE_LIMITS_APPS.include?(key)
    end
  end
end

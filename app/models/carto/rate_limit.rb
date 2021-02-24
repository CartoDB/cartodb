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
                             :sql_job_delete,
                             :sql_copy_from,
                             :sql_copy_to].freeze

    RATE_LIMIT_ATTRIBUTES.each do |attr|
      serialize attr, Carto::RateLimitValues
      validates attr, presence: true
    end

    # FIXME remove this after syncing rate_limits
    RATE_LIMIT_DEFAULTS = {
      sql_copy_from: [1, 1, 60],
      sql_copy_to: [1, 1, 60]
    }.freeze
    ###

    def self.from_api_attributes(attributes)
      rate_limit = new
      rate_limit.rate_limit_attributes(attributes).each { |k, v| rate_limit[k] = Carto::RateLimitValues.new(v) }
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
      attrs.with_indifferent_access.slice(*RATE_LIMIT_ATTRIBUTES)
           .reverse_merge!(RATE_LIMIT_DEFAULTS) # FIXME remove this after syncing rate_limits
    end

    def ==(rate_limit)
      super(rate_limit) ||
        rate_limit_attributes.lazy.zip(rate_limit.rate_limit_attributes).all? do |x, y|
          x == y
        end
    end
  end
end

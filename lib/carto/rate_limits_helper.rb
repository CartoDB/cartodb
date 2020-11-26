module Carto
  module RateLimitsHelper

    def self.create_rate_limits(rate_limit_attributes)
      rate_limit = Carto::RateLimit.from_api_attributes(rate_limit_attributes)
      rate_limit.save!
      rate_limit
    end

  end
end

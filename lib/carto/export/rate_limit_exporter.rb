module Carto
  module RateLimitImporter
    private

    def build_rate_limit_from_hash(exported_hash)
      return unless exported_hash

      rate_limit = Carto::RateLimit.from_api_attributes(exported_hash[:limits])
      rate_limit.id = exported_hash[:id]

      rate_limit.save!
      rate_limit
    end
  end

  module RateLimitExporter
    private

    def export_rate_limit(rate_limit)
      return unless rate_limit

      {
        id: rate_limit.id,
        limits: rate_limit.api_attributes
      }
    end
  end
end

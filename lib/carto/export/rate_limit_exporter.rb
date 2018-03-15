# Version History
# 1.0.0: export rate limit
module Carto
  module RateLimitExporterConfiguration
    CURRENT_VERSION = '1.0.0'.freeze
    EXPORTED_RATE_LIMIT_ATTRIBUTES = [:id,
                                      :maps_anonymous,
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
                                      :sql_query,
                                      :sql_query_format,
                                      :sql_job_create,
                                      :sql_job_get,
                                      :sql_job_delete].freeze

    def compatible_version?(version)
      version.to_i == CURRENT_VERSION.split('.')[0].to_i
    end
  end

  module RateLimitImporter
    include RateLimitExporterConfiguration

    private

    def build_rate_limit_from_hash(exported_hash)
      return unless exported_hash

      raise 'Wrong rate limit export version' unless compatible_version?(exported_hash[:version])

      exported_rate_limit = exported_hash[:rate_limit]

      attributes = exported_rate_limit.slice(*EXPORTED_RATE_LIMIT_ATTRIBUTES)
      rate_limit_attributes = attributes.slice(*Carto::RateLimit::RATE_LIMIT_ATTRIBUTES)
      rate_limit = RateLimit.new
      rate_limit_attributes.each { |k, v| rate_limit[k] = RateLimitValues.new(v) }
      rate_limit.id = exported_rate_limit[:id]

      rate_limit.save!
      rate_limit
    end
  end

  module RateLimitExporter
    include RateLimitExporterConfiguration

    private

    def export_rate_limit(rate_limit)
      {
        version: CURRENT_VERSION,
        rate_limit: export(rate_limit)
      }
    end

    def export(rate_limit)
      other_attributes = EXPORTED_RATE_LIMIT_ATTRIBUTES - Carto::RateLimit::RATE_LIMIT_ATTRIBUTES
      rate_limit_attributes = EXPORTED_RATE_LIMIT_ATTRIBUTES - other_attributes

      attrs_hash = other_attributes.map { |att| [att, rate_limit.attributes[att.to_s]] }.to_h
      rate_limit_hash = rate_limit_attributes.map { |att| [att, rate_limit.attributes[att.to_s].to_array] }.to_h

      attrs_hash.merge(rate_limit_hash)
    end
  end
end

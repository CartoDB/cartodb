module CartoDB
  module GeocoderMetricsDecorator

    HIGH_RESOLUTION_GEOCODER = 'high-resolution'

    def store_metrics(payload)
      geocoder_type = payload[:geocoder_type]
      geocoder_kind = payload[:kind]
      metrics = calculate_metrics(payload)
      store_geocoder_metrics(geocoder_type, metrics)
      store_cache_metrics(metrics) if geocoder_kind == HIGH_RESOLUTION_GEOCODER
    end

    private

    def calculate_metrics(payload)
      failed_rows = Integer(payload[:failed_rows]) rescue 0
      cache_hits = Integer(payload[:cache_hits]) rescue 0
      successful_responses = Integer(payload[:successful_rows]) rescue 0
      successful_responses = successful_responses - cache_hits
      cache_misses = successful_responses
      empty_responses = payload[:success] ? failed_rows : 0
      failed_responses = !payload[:success] ? failed_rows : 0

      {
        successful_responses: successful_responses,
        empty_responses: empty_responses,
        failed_responses: failed_responses,
        cache_hits: cache_hits,
        cache_misses: cache_misses,
        total_requests: (successful_responses + empty_responses + failed_responses)
      }
    end

    def store_geocoder_metrics(geocoder_type, metrics)
      today = Date.today.strftime('%Y%m%d')
      geocoder_metrics = CartoDB::GeocoderMetrics.new(user, geocoder_type)
      geocoder_metrics.add_responses(
        CartoDB::GeocoderMetrics::SUCCESSFUL_RESPONSE_TYPE,
        today,
        metrics[:successful_responses]
      )
      geocoder_metrics.add_responses(
        CartoDB::GeocoderMetrics::EMPTY_RESPONSE_TYPE,
        today,
        metrics[:empty_responses]
      )
      geocoder_metrics.add_responses(
        CartoDB::GeocoderMetrics::FAILED_RESPONSE_TYPE,
        today,
        metrics[:failed_responses]
      )
      geocoder_metrics.add_responses(
        CartoDB::GeocoderMetrics::TOTAL_RESPONSE_TYPE,
        today,
        metrics[:total_requests]
      )
    end

    def store_cache_metrics(metrics)
      today = Date.today.strftime('%Y%m%d')
      cache_metrics = CartoDB::GeocoderMetrics.new(user, 'cache')
      cache_metrics.add_responses(
        CartoDB::GeocoderMetrics::CACHE_HITS_TYPE,
        today,
        metrics[:cache_hits]
      )
      cache_metrics.add_responses(
        CartoDB::GeocoderMetrics::CACHE_MISSES_TYPE,
        today,
        metrics[:cache_misses]
      )
    end
  end
end

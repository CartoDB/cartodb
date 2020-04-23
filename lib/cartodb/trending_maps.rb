require_dependency 'carto/uuidhelper'

module CartoDB
  class TrendingMaps
    include Carto::UUIDHelper

    # The ratio for this sequence is 2
    GEOMETRIC_SEQUENCE_BASE = 500
    DAYS_TO_CHECK = 1

    def get_trending_maps(simulation=false)
      trending_maps = {}
      stats_manager = CartoDB::Stats::APICalls.new
      date = Date.today - DAYS_TO_CHECK.days
      date_key = date.strftime("%Y%m%d")
      $users_metadata.scan_each(:match => "user:*") do |key|
        next if key =~ /global/
        key_parts = key.split(':')
        username = key_parts[1]
        visualization_id = key_parts[4]
        next unless uuid?(visualization_id)
        yesterday_mapviews = stats_manager.get_api_calls_from_redis(
          username,
          from: date,
          to: date,
          stat_tag: visualization_id
        )
        total_mapviews = stats_manager.get_total_api_calls_from_redis(username, visualization_id)
        if is_trending_map?(yesterday_mapviews[date_key], total_mapviews)
          trending_map_data = build_trending_map(visualization_id, username, total_mapviews)
          trending_maps[visualization_id] = trending_map_data unless trending_map_data.blank?
        end
      end
      trending_maps
    end

    def build_trending_map(visualization_id, username, total_mapviews)
      visualization = Carto::Visualization.find(visualization_id)
      {
        user: username,
        user_mail: visualization.user.email,
        user_public_url: visualization.user.public_url,
        mapviews: total_mapviews,
        visualization_name: visualization.name
      }
    rescue => e
      CartoDB.notify_error("Trending map visualization unknown", visualization: visualization_id, error: e.inspect)
      {}
    end

    def notify_trending_map(visualization_id, mapviews, preview_image = nil)
      ::Resque.enqueue(::Resque::UserJobs::Mail::TrendingMap, visualization_id, mapviews, preview_image)
    end

    def send_trending_map_report(trending_visualizations)
      reports_mail_to = Cartodb.get_config(:reports, 'mail_to')
      if reports_mail_to.blank?
        CartoDB.notify_error("Reporter mail_to property missing")
      else
        ::Resque.enqueue(
          ::Resque::Reporter::Mail::TrendingMapsReport,
          reports_mail_to,
          trending_visualizations
        )
      end
    end

    def is_trending_map?(mapviews_number_before, total_mapviews_today)
      return false if total_mapviews_today < GEOMETRIC_SEQUENCE_BASE
      total_mapviews_yesterday = total_mapviews_today - mapviews_number_before
      geometric_sequence_position_yesterday = Math.log2(total_mapviews_yesterday/GEOMETRIC_SEQUENCE_BASE)
      geometric_sequence_position_today = Math.log2(total_mapviews_today/GEOMETRIC_SEQUENCE_BASE)
      # Base case where yesterday was minor than 500 and now is 500 or more
      return true if geometric_sequence_position_yesterday < 0 && geometric_sequence_position_today >= 0
      geometric_sequence_position_today.to_i > geometric_sequence_position_yesterday.to_i
    end

  end
end

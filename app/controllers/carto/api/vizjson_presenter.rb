require_relative '../../../models/visualization/vizjson'
require_relative '../../../helpers/redis_vizjson_cache'
require_relative 'visualization_vizjson_adapter'

module Carto
  module Api
    class VizJSONPresenter

      DEFAULT_TILER_FILTER = 'mapnik'

      def initialize(visualization, redis_cache)
        @visualization = visualization
        @redis_cache = redis_cache
        @redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new(redis_cache)
        @configuration = Cartodb.config
      end

      def to_vizjson(options={})
        @redis_vizjson_cache.cached(@visualization.id, options.fetch(:https_request, false)) do
          calculate_vizjson(options)
        end
      end

      private


      def calculate_vizjson(options={})
        vizjson_options = {
          full: false,
          user_name: user.username,
          user_api_key: user.api_key,
          user: user,
          viewer_user: user,
          dynamic_cdn_enabled: user.dynamic_cdn_enabled,
          tiler_filter: @configuration[:tiler].fetch('filter', DEFAULT_TILER_FILTER),
        }.merge(options)
        CartoDB::Visualization::VizJSON.new(Carto::Api::VisualizationVizJSONAdapter.new(@visualization, @redis_cache), vizjson_options, @configuration).to_poro
      end

      def user
        @user ||= @visualization.user
      end

    end
  end
end

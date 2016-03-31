require_dependency 'visualization/vizjson'
require_dependency 'carto/api/visualization_vizjson_adapter'
require_dependency 'cartodb/redis_vizjson_cache'

module Carto
  module Api
    class VizJSONPresenter

      def initialize(visualization, redis_cache)
        @visualization = visualization
        @redis_cache = redis_cache
        @redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new(redis_cache)
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
          viewer_user: user
        }.merge(options)
        CartoDB::Visualization::VizJSON.new(Carto::Api::VisualizationVizJSONAdapter.new(@visualization, @redis_cache), vizjson_options, Cartodb.config).to_poro
      end

      def user
        @user ||= @visualization.user
      end

    end
  end
end

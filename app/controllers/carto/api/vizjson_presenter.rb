require_relative '../../../models/visualization/vizjson'
require_relative 'visualization_vizjson_adapter'

module Carto
  module Api
    class VizJSONPresenter

      def initialize(visualization, redis_cache)
        @visualization = visualization
        @redis_cache = redis_cache
      end

      def to_vizjson(options={})
        key = redis_vizjson_key(options.fetch(:https_request, false))
        redis_cached(key) do
          calculate_vizjson(options)
        end
      end

      private

      def redis_vizjson_key(https_flag = false)
        "visualization:#{@visualization.id}:vizjson:#{https_flag ? 'https' : 'http'}"
      end

      def redis_cached(key)
        value = @redis_cache.get(key)
        if value.present?
          return JSON.parse(value, symbolize_names: true)
        else
          result = yield
          serialized = JSON.generate(result)
          @redis_cache.setex(key, 24.hours.to_i, serialized)
          return result
        end
      end

      def calculate_vizjson(options={})
        vizjson_options = {
          full: false,
          user_name: user.username,
          user_api_key: user.api_key,
          user: user,
          viewer_user: user,
          dynamic_cdn_enabled: user.dynamic_cdn_enabled
        }.merge(options)
        CartoDB::Visualization::VizJSON.new(Carto::Api::VisualizationVizJSONAdapter.new(@visualization), vizjson_options, 
                                            Cartodb.config)
                                       .to_poro
      end

      def user
        @user ||= @visualization.user
      end

    end
  end
end

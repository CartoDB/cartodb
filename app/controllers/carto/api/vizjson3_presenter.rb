require_relative 'vizjson_presenter'

module Carto
  module Api
    class VizJSON3Presenter

      def initialize(visualization, redis_cache)
        @visualization = visualization
        @redis_cache = redis_cache
        @redis_vizjson_cache = CartoDB::Visualization::RedisVizjsonCache.new(redis_cache)
      end

      def to_vizjson(options = {})
        vizjson = Carto::Api::VizJSONPresenter.new(@visualization, @redis_cache).to_vizjson(options)
        vizjson[:widgets] = Carto::Widget.from_visualization_id(@visualization.id).map do |w|
          Carto::Api::WidgetPresenter.new(w).to_poro
        end
        vizjson
      end

    end
  end
end

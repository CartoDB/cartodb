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
        vizjson[:datasource] = datasource(options)
        vizjson[:user] = user
        vizjson
      end

      private

      def datasource(options)
        api_templates_type = options.fetch(:https_request, false) ? 'private' : 'public'
        {
          user_name: @visualization.user.username,
          maps_api_template: ApplicationHelper.maps_api_template(api_templates_type),
          stat_tag: @visualization.id,
          template_name: CartoDB::NamedMapsWrapper::NamedMap.template_name(@visualization.id)
        }
      end

      def user
        {
          fullname: @visualization.user.name.present? ? @visualization.user.name : @visualization.user.username,
          avatar_url: @visualization.user.avatar_url
        }
      end
    end
  end
end

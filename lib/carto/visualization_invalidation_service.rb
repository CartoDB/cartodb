module Carto
  class VisualizationInvalidationService
    def initialize(visualization)
      @visualization = visualization
    end

    def invalidate
      invalidate_embeds_from_redis
      invalidate_vizjson_from_redis
      invalidate_vizjson_from_varnish
      update_or_destroy_named_map
    end

    private

    def update_or_destroy_named_map
      return if @visualization.remote?
      if @visualization.destroyed?
        @visualization.destroy_named_map
      elsif @visualization.data_layers.any?
        named_maps_api = Carto::NamedMaps::Api.new(@visualization.for_presentation)
        named_maps_api.show ? named_maps_api.update : named_maps_api.create
      end
    end

    def invalidate_embeds_from_redis
      EmbedRedisCache.new($tables_metadata).invalidate(@visualization.id)
    end

    def invalidate_vizjson_from_redis
      CartoDB::Visualization::RedisVizjsonCache.new.invalidate(@visualization.id)
    end

    def invalidate_vizjson_from_varnish
      CartoDB::Varnish.new.purge(".*#{@visualization.id}:vizjson")
    end
  end
end

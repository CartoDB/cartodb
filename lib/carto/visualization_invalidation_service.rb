module Carto
  class VisualizationInvalidationService
    def initialize(visualization)
      @visualization = visualization
    end

    def invalidate
      invalidate_caches
      invalidate_affected_visualizations if attributes_affecting_visualizations_changed?
      update_or_destroy_named_map
    end

    protected

    def invalidate_caches
      invalidate_embeds_from_redis
      invalidate_vizjson_from_redis
      invalidate_vizjson_from_varnish
    end

    private

    def update_or_destroy_named_map
      return if @visualization.remote?
      named_maps_api = Carto::NamedMaps::Api.new(@visualization.for_presentation)
      if @visualization.destroyed?
        named_maps_api.destroy
      elsif @visualization.data_layers.any?
        named_maps_api.upsert
      end
    end

    def invalidate_affected_visualizations
      return unless @visualization.user_table
      # Invalidate the maps where this table is used. This is needed because the attributions of the datasets used
      # in a map is used in the vizjson, and the description is shown in the public pages/embed.
      # There is no need to invalidate the named maps, as nothing from the dataset is included there.
      @visualization.user_table.dependent_visualizations.each do |affected_visualization|
        VisualizationInvalidationService.new(affected_visualization).invalidate_caches
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

    def attributes_affecting_visualizations_changed?
      @visualization.canonical? &&
        (
          @visualization.previous_changes.include?(:description) ||
          @visualization.previous_changes.include?(:attributions)
        )
    end
  end
end

require_relative '../../../helpers/carto/html_safe'
require_relative 'layer_vizjson_adapter'

module Carto
  module Api
    class VisualizationVizJSONAdapter
      extend Forwardable
      include Carto::HtmlSafe

      delegate [:id, :map, :qualified_name, :likes, :description, :retrieve_named_map?, :password_protected?, :overlays,
                :prev_id, :next_id, :transition_options, :has_password?, :parent_id, :get_auth_tokens, :user,
                :related_canonical_visualizations
               ] => :visualization

      attr_reader :visualization

      def initialize(visualization, redis_cache = nil)
        @visualization = visualization
        @layer_cache = {}
        # INFO: needed for children
        @redis_cache = redis_cache
      end

      def layers(kind)
        @layer_cache[kind] ||= get_layers(kind)
      end

      def attributions_from_derived_visualizations
        @visualization.related_canonical_visualizations.map(&:attributions).reject {|attribution| attribution.blank?}
      end

      def children
        @visualization.children.map { |v|
          Carto::Api::VisualizationVizJSONAdapter.new(v, @redis_cache)
        }
      end

      def parent
        @visualization.parent ? Carto::Api::VisualizationVizJSONAdapter.new(@visualization.parent, @redis_cache) : nil
      end

      def to_vizjson
        Carto::Api::VizJSONPresenter.new(self, @redis_cache).to_vizjson
      end

      private

      def get_layers(kind)
        choose_layers(kind).map { |layer|
          Carto::Api::LayerVizJSONAdapter.new(layer)
        }
      end

      def choose_layers(kind)
        case kind
        when :base
          map.user_layers
        when :cartodb
          map.carto_layers
        when :others
          map.other_layers
        else
          raise "Unknown: #{kind}"
        end
      end

    end
  end
end

require_relative '../../../helpers/carto/html_safe'
require_relative 'layer_vizjson_adapter'

module Carto
  module Api
    class VisualizationVizJSONAdapter
      extend Forwardable
      include Carto::HtmlSafe

      delegate [:id, :map, :qualified_name, :likes, :description, :retrieve_named_map?, :password_protected?, :overlays, 
                :prev_id, :next_id, :transition_options, :has_password?, :children, :parent_id, :parent, :get_auth_tokens 
               ] => :visualization

      attr_reader :visualization

      def initialize(visualization)
        @visualization = visualization
        @layer_cache = {}
      end

      def description_html_safe
        markdown_html_safe(description)
      end

      def layers(kind)
        @layer_cache[kind] ||= get_layers(kind)
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
          map.data_layers
        when :others
          map.other_layers
        else
          raise "Unknown: #{kind}"
        end
      end

    end
  end
end

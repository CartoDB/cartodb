
module Carto
  module Api
    class LayerVizJSONAdapter
      extend Forwardable

      TEMPLATES_MAP = {
        'table/views/infowindow_light' =>               'infowindow_light',
        'table/views/infowindow_dark' =>                'infowindow_dark',
        'table/views/infowindow_light_header_blue' =>   'infowindow_light_header_blue',
        'table/views/infowindow_light_header_yellow' => 'infowindow_light_header_yellow',
        'table/views/infowindow_light_header_orange' => 'infowindow_light_header_orange',
        'table/views/infowindow_light_header_green' =>  'infowindow_light_header_green',
        'table/views/infowindow_header_with_image' =>   'infowindow_header_with_image'
      }

      delegate [:options, :kind, :id, :order, :legend, :user] => :layer

      attr_reader :layer

      def initialize(layer)
        @layer = layer
      end

      def public_values
        {
          'options' => options,

          # TODO: kind should be renamed to type
          # rename once a new layer presenter is written. See CartoDB::LayerModule::Presenter#with_kind_as_type
          # TODO: use symbols instead of strings
          'kind' => kind,

          'infowindow' => infowindow,
          'tooltip' => tooltip,
          'id' => id,
          'order' => order
        }
      end

      def get_presenter(options, configuration)
        Carto::Api::LayerPresenter.new(self, options, configuration)
      end

      def infowindow
        @layer.infowindow
      end

      def tooltip
        @layer.tooltip
      end

      def infowindow_template_path
        if infowindow.present? && infowindow['template_name'].present?
          template_name = TEMPLATES_MAP.fetch(infowindow['template_name'], self.infowindow['template_name'])
          Rails.root.join("lib/assets/javascripts/cartodb/table/views/infowindow/templates/#{template_name}.jst.mustache")
        else
          nil
        end
      end

      def tooltip_template_path
        if tooltip.present? && tooltip['template_name'].present?
          template_name = TEMPLATES_MAP.fetch(tooltip['template_name'], tooltip['template_name'])
          Rails.root.join("lib/assets/javascripts/cartodb/table/views/tooltip/templates/#{template_name}.jst.mustache")
        else
          nil
        end
      end

    end
  end
end

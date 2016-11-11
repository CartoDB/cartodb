module Carto
  module Api
    class InfowindowGenerator
      def initialize(layer)
        @layer = layer
      end

      def infowindow_data_v1
        with_template(@layer.infowindow, @layer.infowindow_template_path)
      rescue => e
        CartoDB::Logger.error(exception: e)
        throw e
      end

      def infowindow_data_v2
        whitelisted_infowindow(with_template(@layer.infowindow, @layer.infowindow_template_path))
      rescue => e
        CartoDB::Logger.error(exception: e)
        throw e
      end

      def tooltip_data_v2
        whitelisted_infowindow(with_template(@layer.tooltip, @layer.tooltip_template_path))
      rescue => e
        CartoDB::Logger.error(exception: e)
        throw e
      end

      def default_infowindow
        default_templated
      end

      def default_tooltip
        default_templated
      end

      private

      INFOWINDOW_KEYS = %w(
        fields template_name template alternative_names width maxHeight
      )

      def whitelisted_infowindow(infowindow)
        infowindow.nil? ? nil : infowindow.select { |key, value|
                                                    INFOWINDOW_KEYS.include?(key) || INFOWINDOW_KEYS.include?(key.to_s)
                                                  }
      end

      def with_template(infowindow, path)
        # Careful with this logic:
        # - nil means absolutely no infowindow (e.g. a torque)
        # - path = nil or template filled: either pre-filled or custom infowindow, nothing to do here
        # - template and path not nil but template not filled: stay and fill
        return nil if infowindow.nil?

        template = infowindow['template']
        return infowindow if (!template.nil? && !template.empty?) || path.nil?

        infowindow[:template] = File.read(path)
        infowindow
      end

      def default_templated
        { "fields" => [], "template_name" => "none", "template" => "", "alternative_names" => {}, "width" => 226, "maxHeight" => 180 }
      end
    end
  end
end

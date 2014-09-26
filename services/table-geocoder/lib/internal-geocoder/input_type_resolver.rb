# encoding: utf-8

module CartoDB

  module InternalGeocoder

    class InputTypeResolver

      def initialize(internal_geocoder)
        @internal_geocoder = internal_geocoder
      end

      def type
        [kind, country_input_type, geometry_type]
      end

      def kind
        @internal_geocoder.kind
      end

      def geometry_type
        @internal_geocoder.geometry_type
      end

      def country_input_type
        if @internal_geocoder.country_column
          :column
        else
          :text
        end
      end

    end # InputTypeResolver
  end # InternalGeocoder

end
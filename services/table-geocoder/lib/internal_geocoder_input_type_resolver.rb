# encoding: utf-8

module CartoDB

  class InternalGeocoderInputTypeResolver

    def initialize(internal_geocoder)
      @internal_geocoder = internal_geocoder
    end

    def type
      [kind, geometry_type, country_input_type]
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
        :freetext
      end
    end

  end

end
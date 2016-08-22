# encoding utf-8

require_relative 'segment'

module Carto
  module Tracking
    module Formats
      class CartoApi
        def initialize(hash)
          @hash = hash ? hash.with_indifferent_access : Hash.new
        end

        def fetch_record(symbol)
          symbol_string = symbol.to_s
          record_class_name = "Carto::#{symbol_string.camelize}".freeze
          record_id = "#{symbol_string}_id".freeze

          record_class_name.constantize.find(@hash[record_id])
        rescue
          nil
        end

        def to_segment_properties
          user = fetch_record(:user)
          visualization = fetch_record(:visualization)

          Carto::Tracking::Formats::Segment.new(user: user,
                                                visualization: visualization,
                                                origin: @hash[:origin]).properties
        end
      end
    end
  end
end

# encoding utf-8

require_relative 'segment'

module Carto
  module Tracking
    module Formats
      class CartoApi
        def initialize(hash)
          @hash = hash ? hash.with_indifferent_access : Hash.new
        end

        # Symbol should be provided as a snake-case'd version the record's model class name.
        # The id of said record should be provided with key: snake-case'd identifier + '_id'
        # Only Cart:: records allowed!
        #  Ex.: :super_duper_mdoel -> Carto::SuperDuperModel; { super_duper_model_id: xxx }
        def fetch_record(symbol)
          symbol_string = symbol.to_s.downcase
          record_class_name = "Carto::#{symbol_string.camelize}".freeze
          record_id = "#{symbol_string}_id".freeze

          record_class_name.constantize.find(@hash[record_id])
        rescue
          nil
        end

        def to_segment
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

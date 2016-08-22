# encoding utf-8

module Carto
  module Tracking
    class Format
      def initialize(hash)
        @hash = hash ? hash.with_indifferent_access : Hash.new
      end

      def fetch(object_symbol)
        snake_case = object_symbol.to_s
        class_name = "Carto::#{snake_case.camelize}".freeze
        object_id = "#{snake_case}_id".freeze

        class_name.constantize.find(@hash[object_id])
      rescue
        nil
      end
    end
  end
end

# encoding: utf-8

module CartoGearsApi
  module Queue
    # Used by the API, not meant to be used directly.
    class GenericJob
      @queue = :gears

      def self.perform(class_name, class_method, *args)
        Object.const_get(class_name).send(class_method, *args)
      end
    end
  end
end

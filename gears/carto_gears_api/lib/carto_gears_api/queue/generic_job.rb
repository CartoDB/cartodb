# encoding: utf-8

module CartoGearsApi
  module Queue
    class GenericJob
      @queue = :gears

      def self.perform(class_name, method, *args)
        Object.const_get(class_name).send(method, *args)
      end
    end
  end
end
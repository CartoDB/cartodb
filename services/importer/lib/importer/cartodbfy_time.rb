module CartoDB
  module Importer2

    class CartodbfyTime

      @@instances = {}

      # Gets an instance unique per process + data_import_id
      def self.instance(data_import_id)
        @@instances[data_import_id] ||= new
      end

      def initialize
        @cartodbfy_time = 0.0
      end

      def add(elapsed_time)
        @cartodbfy_time += elapsed_time
      end

      def get
        return @cartodbfy_time
      end

    end

  end
end

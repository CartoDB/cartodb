# encoding: utf-8

module CartoDB
  module Importer2
    class Result
      ATTRIBUTES = %w{ name schema extension tables success error_code log_trace support_tables }
      attr_reader *ATTRIBUTES.map(&:to_sym)
      attr_writer :name

      def initialize(attributes)
        @support_tables = []

        ATTRIBUTES.each do |attribute|
          instance_variable_set :"@#{attribute}",
            attributes.fetch(attribute.to_sym, nil)
        end
      end

      def success?
        success == true
      end

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end

      def table_name
        tables.first
      end

      def update_support_tables(new_list)
        @support_tables = new_list
      end
    end
  end
end

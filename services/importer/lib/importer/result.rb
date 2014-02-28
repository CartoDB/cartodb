# encoding: utf-8

module CartoDB
  module Importer2
    class Result
      ATTRIBUTES = %w{ name schema extension tables success error_code log_trace }
      attr_reader *ATTRIBUTES.map(&:to_sym)

      def initialize(attributes)
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
    end # Result
  end # Importer2
end # CartoDB


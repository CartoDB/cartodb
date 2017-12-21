# encoding: utf-8

module CartoDB
  module Importer2
    class Result
      ATTRIBUTES = %w{ name schema extension tables success error_code log_trace support_tables original_name }.freeze
      attr_reader *ATTRIBUTES.map(&:to_sym)
      attr_writer :name

      def initialize(attributes)
        @support_tables = []

        ATTRIBUTES.each do |attribute|
          instance_variable_set :"@#{attribute}",
            attributes.fetch(attribute.to_sym, nil)
        end

        @original_name = name
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

      def to_s
        "<Result #{name}>"
      end

      def inspect
        attrs = (ATTRIBUTES - ['log_trace']).map { |attr| "@#{attr}=#{instance_variable_get "@#{attr}"}" }.join(', ')
        "<#{self.class} #{attrs}>"
      end

    end
  end
end

# encoding: utf-8

require_relative 'input_type_resolver'

module CartoDB
  module InternalGeocoder

    class AbstractQueryGenerator

      def initialize(internal_geocoder)
        @internal_geocoder = internal_geocoder
      end

      #TODO custom exception
      def search_terms_query(page)
        raise 'Not implemented'
      end

      def post_process_search_terms_query(results)
        raise 'Not implemented'
      end

      def dataservices_query_template
        raise 'Not implemented'
      end

      def copy_results_to_table_query
        raise 'Not implemented'
      end

    end # AbstractQueryGenerator

  end # InternalGeocoder
end #CartoDB
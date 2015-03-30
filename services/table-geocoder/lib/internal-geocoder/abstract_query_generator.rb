# encoding: utf-8

require_relative 'input_type_resolver'
require_relative '../../../importer/lib/importer/query_batcher'

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

      def dataservices_query(search_terms)
        raise 'Not implemented'
      end

      def copy_results_to_table_query
        raise 'Not implemented'
      end

      def country
        country = @internal_geocoder.countries
        (country == %Q{'world'} || country.blank?) ? 'null' : country
      end

      def dest_table
        @internal_geocoder.qualified_table_name
      end

    end # AbstractQueryGenerator

  end # InternalGeocoder
end #CartoDB

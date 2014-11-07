# encoding: utf-8

module CartoDB
  module Importer2
    class ContentGuesser

      def initialize(db, table_name, schema, options)
        @db         = db
        @table_name = table_name
        @schema     = schema
        @options    = options
      end

      def enabled?
        @options[:guessing][:enabled]
      end

      def country_column
        return nil if not enabled?
        columns.each do |column|
          return column[:column_name] if is_country_column? column
        end
        nil
      end

      def columns
        @columns ||= db[%Q(
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = '#{table_name}' AND table_schema = '#{schema}'
        )]
      end

      def is_country_column?(column)
        return false unless is_country_column_type? column
        column_name_sym = column[:column_name].to_sym
        matches = sample.count { |row| countries.include? row[column_name_sym].downcase }
        proportion = matches.to_f / sample.count
        if proportion > threshold
          return true
        else
          return false
        end
      end

      def threshold
        @options[:guessing][:threshold]
      end

      def is_country_column_type? column
        if ['character varying', 'varchar', 'text'].include? column[:data_type]
          return true
        else
          return false
        end
      end

      def sample
        @sample ||= db[%Q(
          SELECT * FROM #{qualified_table_name}
          ORDER BY random() LIMIT #{sample_size}
        )].all
      end

      def sample_size
        @options[:guessing][:sample_size]
      end

      def countries
        return @countries if @countries
        geocoder_sql_api_config = @options[:geocoder][:internal]
        geocoder_sql_api = CartoDB::SQLApi.new(geocoder_sql_api_config)
        query = 'SELECT synonyms FROM country_decoder'
        @countries = Set.new()
        geocoder_sql_api.fetch(query).each do |country|
          @countries.merge country['synonyms']
        end
        @countries
      end

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end

    end
  end
end

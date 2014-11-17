# encoding: utf-8

module CartoDB
  module Importer2
    class ContentGuesser

      COUNTRIES_QUERY = 'SELECT synonyms FROM country_decoder'
      MINIMUM_ENTROPY = 0.9

      def initialize(db, table_name, schema, options)
        @db         = db
        @table_name = table_name
        @schema     = schema
        @options    = options
      end

      def enabled?
        @options[:guessing][:enabled] rescue false
      end

      def country_column
        return nil if not enabled?
        columns.each do |column|
          return column[:column_name] if is_country_column? column
        end
        nil
      end

      def columns
        @columns ||= @db[%Q(
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = '#{@table_name}' AND table_schema = '#{@schema}'
        )]
      end

      def is_country_column?(column)
        return false unless is_country_column_type? column
        return false unless metric_entropy(column) > MINIMUM_ENTROPY
        return country_proportion(column) > threshold
      end

      # See http://en.wikipedia.org/wiki/Entropy_(information_theory)
      # See http://www.shannonentropy.netmark.pl/
      #
      # Returns 0.0 if all elements in the column are repeated
      # Returns 1.0 if all elements in the column are different
      def metric_entropy(column)
        shannon_entropy(column) / Math.log(sample.count)
      end

      def shannon_entropy(column)
        sum = 0.0
        frequencies(column).each { |freq| sum += (freq * Math.log(freq)) }
        return -sum
      end

      # Returns an array with the relative frequencies of the elements of that column
      def frequencies(column)
        frequency_table = {}
        column_name_sym = column[:column_name].to_sym
        sample.each do |row|
          elem = row[column_name_sym]
          frequency_table[elem] += 1 rescue frequency_table[elem] = 1
        end
        length = sample.count.to_f
        frequency_table.map { |key, value| value / length }
      end

      def country_proportion(column)
        column_name_sym = column[:column_name].to_sym
        matches = sample.count { |row| countries.include? row[column_name_sym].downcase }
        matches.to_f / sample.count
      end

      def threshold
        @options[:guessing][:threshold]
      end

      def is_country_column_type? column
        ['character varying', 'varchar', 'text'].include? column[:data_type]
      end

      def sample
        @sample ||= @db[%Q(
          SELECT * FROM #{qualified_table_name}
          #{sample_where_clause}
        )].all
      end

      def sample_where_clause
        @min_id, @max_id = index_limits[:min_id], index_limits[:max_id]
        @ids_count = @max_id - @min_id + 1
        if @ids_count <= sample_size
          ""
        else
          "WHERE ogc_fid IN (#{sample_indices.to_a.join(',')})"
        end
      end

      #TODO move to a collaborator
      def sample_indices
        if @ids_count / 2 > sample_size
          sample_indices_add_method
        else
          sample_indices_delete_method
        end
      end

      def sample_indices_add_method
        sample_indices = Set.new
        while sample_indices.size < sample_size
          random_index = rand(@min_id..@max_id)
          sample_indices.add(random_index)
        end
        sample_indices
      end

      def sample_indices_delete_method
        sample_indices = Set.new(@min_id..@max_id)
        while sample_indices.size > sample_size
          random_index = rand(@min_id..@max_id)
          sample_indices.delete random_index
        end
        sample_indices
      end

      def index_limits
        #TODO extract ogc_fid somewhere
        @index_limits ||= @db[%Q(
          SELECT min(ogc_fid) AS min_id, max(ogc_fid) AS max_id
          FROM #{qualified_table_name}
        )].first
      end

      def sample_size
        @options[:guessing][:sample_size]
      end

      def countries
        return @countries if @countries
        @countries = Set.new()
        geocoder_sql_api.fetch(COUNTRIES_QUERY).each do |country|
          @countries.merge country['synonyms']
        end
        @countries
      end

      def geocoder_sql_api
        @geocoder_sql_api ||= CartoDB::SQLApi.new(@options[:geocoder][:internal])
      end

      attr_writer :geocoder_sql_api

      def qualified_table_name
        %Q("#{@schema}"."#{@table_name}")
      end

    end
  end
end

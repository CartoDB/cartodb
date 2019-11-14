require_relative 'content_guesser'

module CartoDB
  module Importer2

      # This should return enough information to the caller so that it can geocode later on:
      #   - whether there're nameplaces or not:      content_guesser.namedplaces.found?
      #   - if there's a country column:             content_guesser.namedplaces.country_column.present?
      #   - in that case, which one it is:           content_guesser.namedplaces.country_column
      #   - otherwise, which is the guessed country: content_guesser.namedplaces.country
      #   - what's the candidate column:             content_guesser.namedplaces.column
      class NamedplacesGuesser

        def initialize(content_guesser)
          @run = false
          @guesser = content_guesser
        end

        def found?
          raise ContentGuesserException, 'not run yet!' unless run?
          !column.nil?
        end

        def column
          raise ContentGuesserException, 'not run yet!' unless run?
          @column
        end

        def run!
          if country_column
            guess_with_country_column
          else
            namedplaces_guess_country
          end
          @run = true
          self
        end

        def run?
          @run
        end

        def country_column
          return @country_column if defined?(@country_column)
          candidate = text_columns.sort{|a,b| country_proportion(a) <=> country_proportion(b)}.last
          @country_column = (candidate && (country_proportion(candidate) > @guesser.threshold)) ? candidate : nil
        end

        def country_column_name
          country_column[:column_name] if country_column
        end

        def country
          @country
        end

        private

        def country_proportion(column)
          @guesser.country_proportion(column)
        end

        def guess_with_country_column
          candidate_columns = text_columns.reject{|c| c == country_column}
          candidate = candidate_columns.sort{|a,b| proportion(a) <=> proportion(b)}.last
          @column = (candidate && (proportion(candidate) > @guesser.threshold)) ? candidate : nil
        end

        def namedplaces_guess_country
          text_columns.each do |candidate|
            column_name_sym = candidate[:column_name].to_sym
            places = @guesser.sample.map{|row| sql_sanitize(row[column_name_sym])}.join(',')
            query = "SELECT namedplace_guess_country(Array[#{places}]) as country"
            country = @guesser.geocoder_sql_api.fetch(query).first['country']
            if country
              @country = country
              @column = candidate
              return @column
            end
          end
        end

        def proportion(column)
          column_name_sym = column[:column_name].to_sym
          matches = count_namedplaces_with_country_column(column_name_sym)
          proportion = matches.to_f / @guesser.sample.count
          proportion
        end

        def count_namedplaces_with_country_column(column_name_sym)
          places = @guesser.sample.map{|row| sql_sanitize(row[column_name_sym])}.join(',')
          country_column_sym = country_column[:column_name].to_sym
          countries = @guesser.sample.map{|row| sql_sanitize(row[country_column_sym])}.join(',')
          query = "WITH geo_function as (SELECT (geocode_namedplace(Array[#{places}], Array[#{countries}])).*) select count(success) FROM geo_function where success = TRUE"
          ret = @guesser.geocoder_sql_api.fetch(query)
          ret.first['count']
        end

        def text_columns
          @text_columns ||= @guesser.columns.all.select{|c| @guesser.is_text_type?(c)}
        end

        def sql_sanitize(str)
          ActiveRecord::Base::sanitize(str)
        end

      end
    end
end

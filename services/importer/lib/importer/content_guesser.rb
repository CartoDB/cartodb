# encoding: utf-8

module CartoDB
  module Importer2
    class ContentGuesser

      attr_reader :db, :table_name, :schema, :job

      def initialize(db, table_name, schema, job, options)
        @db         = db
        @job        = job
        @table_name = table_name
        @schema     = schema
        @options = options
      end


      def create_the_geom_from_country_guessing
        return false if not @options[:guessing][:enabled]
        job.log 'Trying country guessing...'
        column_query = %Q(
          SELECT column_name, data_type
          FROM information_schema.columns
          WHERE table_name = '#{table_name}' AND table_schema = '#{schema}'
        )
        db[column_query].each do |column|
          if ['character varying', 'varchar', 'text'].include? column[:data_type]
            success = try_country_guessing_on column[:column_name].to_sym
            return true if success
          end
        end
        return false
      end

      def try_country_guessing_on(column_name_sym)
        matches = sample.count { |row| countries.include? row[column_name_sym].downcase }
        proportion = matches.to_f / sample.count
        threshold = @options[:guessing][:threshold]
        if proportion > threshold
          job.log "Found country column: #{column_name_sym.to_s}"
          create_the_geom_in(table_name)
          config = @options[:geocoder].merge(
            table_schema: schema,
            table_name: table_name,
            qualified_table_name: qualified_table_name,
            connection: db,
            formatter: column_name_sym.to_s,
            geometry_type: 'polygon',
            kind: 'admin0',
            max_rows: nil,
            country_column: nil
          )
          geocoder = CartoDB::InternalGeocoder::Geocoder.new(config)
          geocoder.run
          return geocoder.state == 'completed'
        end
        return false
      end

      def sample
        return @sample if @sample
        sample_size = @options[:guessing][:sample_size]
        sample_query = %Q(SELECT * FROM #{qualified_table_name} ORDER BY random() LIMIT #{sample_size})
        @sample = db[sample_query].all
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

      #TODO duplicate
      def create_the_geom_in(table_name)
        job.log 'Creating the_geom column'
        return false if column_exists_in?(table_name, 'the_geom')

        db.run(%Q{
          SELECT public.AddGeometryColumn(
            '#{schema}','#{table_name}','the_geom',4326,'geometry',2
          );
        })
      end

      #TODO duplicate
      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end

      #TODO duplicate
      def column_exists_in?(table_name, column_name)
        columns_in(table_name).include?(column_name.to_sym)
      end

      #TODO duplicate
      def columns_in(table_name)
        db.schema(table_name, reload: true, schema: schema).map(&:first)
      end

    end
  end
end

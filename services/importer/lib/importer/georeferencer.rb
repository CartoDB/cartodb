# encoding: utf-8
require_relative './column'
require_relative './job'
require_relative './query_batcher'
require_relative './content_guesser'

module CartoDB
  module Importer2
    class Georeferencer
      DEFAULT_BATCH_SIZE = 50000
      LATITUDE_POSSIBLE_NAMES   = %w{ latitude lat latitudedecimal
        latitud lati decimallatitude decimallat }
      LONGITUDE_POSSIBLE_NAMES  = %w{ longitude lon lng
        longitudedecimal longitud long decimallongitude decimallong }
      GEOMETRY_POSSIBLE_NAMES   = %w{ geometry the_geom wkb_geometry geom geojson wkt }
      DEFAULT_SCHEMA            = 'cdb_importer'
      THE_GEOM_WEBMERCATOR      = 'the_geom_webmercator'

      def initialize(db, table_name, options, schema=DEFAULT_SCHEMA, job=nil, geometry_columns=nil, logger=nil)
        @db         = db
        @job        = job || Job.new({  logger: logger } )
        @table_name = table_name
        @schema     = schema
        @geometry_columns = geometry_columns || GEOMETRY_POSSIBLE_NAMES
        @from_geojson_with_transform = false
        @options = options
        @tracker = @options[:tracker] || lambda { |state| state }
        @content_guesser = CartoDB::Importer2::ContentGuesser.new(@db, @table_name, @schema, @options, @job)
        @importer_stats = ImporterStats.instance
      end

      def set_importer_stats(importer_stats)
        @importer_stats = importer_stats
      end

      def mark_as_from_geojson_with_transform
        @from_geojson_with_transform = true
      end

      def run
        disable_autovacuum

        drop_the_geom_webmercator

        create_the_geom_from_geometry_column  ||
        create_the_geom_from_latlon           ||
        create_the_geom_from_country_guessing ||
        create_the_geom_from_ip_guessing      ||
        create_the_geom_in(table_name)

        enable_autovacuum

        raise_if_geometry_collection
        self
      end

      def disable_autovacuum
        job.log "Disabling autovacuum for #{qualified_table_name}"
        db.run(%Q{
         ALTER TABLE #{qualified_table_name} SET (autovacuum_enabled = FALSE, toast.autovacuum_enabled = FALSE);
        })
      end

      def enable_autovacuum
        job.log "Enabling autovacuum for #{qualified_table_name}"
        db.run(%Q{
         ALTER TABLE #{qualified_table_name} SET (autovacuum_enabled = TRUE, toast.autovacuum_enabled = TRUE);
        })
      end

      def create_the_geom_from_latlon
        latitude_column_name  = latitude_column_name_in
        longitude_column_name = longitude_column_name_in

        return false unless latitude_column_name && longitude_column_name

        job.log 'Creating the_geom from latitude / longitude'
        create_the_geom_in(table_name)
        populate_the_geom_from_latlon(
          qualified_table_name, latitude_column_name, longitude_column_name
        )
      end

      def create_the_geom_from_geometry_column
        column = nil
        geometry_column_name = geometry_column_in
        return false unless geometry_column_name
        job.log "Creating the_geom from #{geometry_column_name} column"
        column = Column.new(db, table_name, geometry_column_name, schema, job)
        column.mark_as_from_geojson_with_transform if @from_geojson_with_transform
        column.empty_lines_to_nulls
        column.geometrify
        unless column_exists_in?(table_name, :the_geom)
          column.rename_to(:the_geom)
        end
        handle_multipoint(qualified_table_name) if multipoint?
        self
      rescue => exception
        job.log "Error creating the_geom: #{exception}. Trace: #{exception.backtrace}"
        if /statement timeout/.match(exception.message).nil?
          if column.empty?
            job.log "Dropping empty #{geometry_column_name}"
            column.drop
          else
            # probably this one needs to be kept doing... but how if times out?
            job.log "Renaming #{geometry_column_name} to invalid_the_geom"
            column.rename_to(:invalid_the_geom)
          end
        end
        false
      end

      def create_the_geom_from_country_guessing
        return false if not @content_guesser.enabled?
        job.log 'Trying country guessing...'
        begin
          country_column_name = nil
          @importer_stats.timing('guessing') do
            @tracker.call('guessing')
            country_column_name = @content_guesser.country_column
            @tracker.call('importing')
          end
          if country_column_name
            job.log "Found country column: #{country_column_name}"
            create_the_geom_in table_name
            return geocode_countries country_column_name
          end
        rescue Exception => ex
          message = "create_the_geom_from_country_guessing failed: #{ex.message}"
          Rollbar.report_message(message,
                                 'warning',
                                 {user_id: @job.logger.user_id, backtrace: ex.backtrace})
          job.log "WARNING: #{message}"
          return false
        end
      end

      #TODO these two methods are very similar, refactor
      def create_the_geom_from_ip_guessing
        return false if not @content_guesser.enabled?
        job.log 'Trying ip guessing...'
        @tracker.call('guessing')
        ip_column_name = @content_guesser.ip_column
        if ip_column_name
          job.log "Found ip column: #{ip_column_name}"
          return geocode_ips ip_column_name
        end
        return false
      end

      def geocode_countries country_column_name
        geocoder = nil
        @importer_stats.timing('geocoding') do
          job.log "Geocoding countries..."
          @tracker.call('geocoding')
          create_the_geom_in(table_name)
          config = @options[:geocoder].merge(
            table_schema: schema,
            table_name: table_name,
            qualified_table_name: qualified_table_name,
            connection: db,
            formatter: country_column_name,
            geometry_type: 'polygon',
            kind: 'admin0',
            max_rows: nil,
            country_column: nil
          )
          geocoder = CartoDB::InternalGeocoder::Geocoder.new(config)
          geocoder.run
          @tracker.call('importing')
          job.log "Geocoding finished"
        end
        geocoder.state == 'completed'
      end

      def geocode_ips ip_column_name
        job.log "Geocoding ips..."
        @tracker.call('geocoding')
        create_the_geom_in(table_name)
        config = @options[:geocoder].merge(
          table_schema: schema,
          table_name: table_name,
          qualified_table_name: qualified_table_name,
          connection: db,
          formatter: ip_column_name,
          geometry_type: 'point',
          kind: 'ipaddress',
          max_rows: nil,
          country_column: nil
        )
        geocoder = CartoDB::InternalGeocoder::Geocoder.new(config)
        geocoder.run
        job.log "Geocoding finished"
        geocoder.state == 'completed'
      end


      # Note: Performs a really simple ',' to '.' normalization.
      # TODO: Candidate for moving to a CDB_xxx function that gets the_geom from lat/long if valid or "convertible"
      def populate_the_geom_from_latlon(qualified_table_name, latitude_column_name, longitude_column_name)
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET
              the_geom = public.ST_GeomFromText(
                'POINT(' || REPLACE(TRIM(CAST("#{longitude_column_name}" AS text)), ',', '.') || ' ' ||
                  REPLACE(TRIM(CAST("#{latitude_column_name}" AS text)), ',', '.') || ')', 4326
              )
              #{QueryBatcher::QUERY_WHERE_PLACEHOLDER}
            WHERE REPLACE(TRIM(CAST("#{longitude_column_name}" AS text)), ',', '.') ~
              '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
            AND REPLACE(TRIM(CAST("#{latitude_column_name}" AS text)), ',', '.')  ~
              '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
            #{QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
          },
          qualified_table_name,
          job,
          'Populating the_geom from latitude / longitude'
        )
      end

      def create_the_geom_in(table_name)
        job.log 'Creating the_geom column'
        return false if column_exists_in?(table_name, 'the_geom')

        db.run(%Q{
          SELECT public.AddGeometryColumn(
            '#{schema}','#{table_name}','the_geom',4326,'geometry',2
          );
        })
      end

      def column_exists_in?(table_name, column_name)
        columns_in(table_name).include?(column_name.to_sym)
      end

      def columns_in(table_name)
        db.schema(table_name, reload: true, schema: schema).map(&:first)
      end

      def latitude_column_name_in
        names = LATITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        name  = find_column_in(table_name, names)
        job.log "Identified #{name} as latitude column" if name
        name
      end

      def longitude_column_name_in
        names = LONGITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        name = find_column_in(table_name, names)
        job.log "Identified #{name} as longitude column" if name
        name
      end

      def geometry_column_in
        names = geometry_columns.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end

      def drop_the_geom_webmercator
        return self unless column_exists_in?(table_name, THE_GEOM_WEBMERCATOR)

        job.log 'Dropping the_geom_webmercator column'
        column = Column.new(db, table_name, THE_GEOM_WEBMERCATOR, schema, job)
        column.drop
      end

      def raise_if_geometry_collection
        column = Column.new(db, table_name, :the_geom, schema, job)
        return self unless column.geometry_type == 'GEOMETRYCOLLECTION'
        raise GeometryCollectionNotSupportedError
      end

      def find_column_in(table_name, possible_names)
        sample = db[%Q{
          SELECT  column_name
          FROM    information_schema.columns
          WHERE   table_name = '#{table_name}'
          AND     table_schema = '#{schema}'
          AND     lower(column_name) in (#{possible_names})
          LIMIT   1
        }].first

        !!sample && sample.fetch(:column_name, false)
      end

      def handle_multipoint(qualified_table_name)
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET the_geom = ST_GeometryN(the_geom, 1)
          },
          qualified_table_name,
          job,
          'Converting detected multipoint to point',
          capture_exceptions=true
        )
      end

      def multipoint?
        is_multipoint = db[%Q{
          SELECT public.GeometryType(the_geom)
          FROM #{qualified_table_name}
          AS geometrytype
        }].first.fetch(:geometrytype) == 'MULTIPOINT'

        job.log 'found MULTIPOING geometry' if is_multipoint

        is_multipoint
      rescue
        false
      end

      private

      attr_reader :db, :table_name, :schema, :job, :geometry_columns

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end
    end
  end
end

# encoding: utf-8
require_relative './column'
require_relative './job'

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
      THE_GEOM_WEBMERCATOR     = 'the_geom_webmercator'

      def initialize(db, table_name, schema=DEFAULT_SCHEMA, job=nil,
      geometry_columns=nil)
        @db         = db
        @job        = job || Job.new
        @table_name = table_name
        @schema     = schema
        @geometry_columns = geometry_columns || GEOMETRY_POSSIBLE_NAMES
      end #initialize

      def run
        disable_autovacuum

        drop_the_geom_webmercator

        create_the_geom_from_geometry_column  || 
        create_the_geom_from_latlon           ||
        create_the_geom_in(table_name)

        enable_autovacuum

        raise_if_geometry_collection
        self
      end #run

      def disable_autovacuum
        job.log "Disabling autovacuum for table #{qualified_table_name}"
        db.run(%Q{
         ALTER TABLE #{qualified_table_name} SET (autovacuum_enabled = FALSE, toast.autovacuum_enabled = FALSE);
        })
      end #disable_autovacuum

      def enable_autovacuum
        job.log "Enabling autovacuum for table #{qualified_table_name}"
        db.run(%Q{
         ALTER TABLE #{qualified_table_name} SET (autovacuum_enabled = TRUE, toast.autovacuum_enabled = TRUE);
        })
      end #enable_autovacuum

      def create_the_geom_from_latlon
        latitude_column_name  = latitude_column_name_in
        longitude_column_name = longitude_column_name_in

        return false unless latitude_column_name && longitude_column_name

        job.log 'Creating the_geom from latitude / longitude'
        create_the_geom_in(table_name)
        populate_the_geom_from_latlon(
          qualified_table_name, latitude_column_name, longitude_column_name
        )
      end #create_the_geom_from_latlon

      def create_the_geom_from_geometry_column
        column = nil
        geometry_column_name = geometry_column_in
        return false unless geometry_column_name
        job.log "Creating the_geom from #{geometry_column_name} column"
        column = Column.new(db, table_name, geometry_column_name, schema, job)
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
      end #create_the_geom_from_geometry_column

      def populate_the_geom_from_latlon(qualified_table_name, latitude_column_name, longitude_column_name)
        job.log 'Populating the_geom from latitude / longitude'

        batch_size = DEFAULT_BATCH_SIZE  # TODO: Magic number, should be benchmarked
        id_column = 'ogc_fid' # Only PostGIS driver (but can be changed, @see http://www.gdal.org/ogr/drv_pg.html)
        temp_finished_column = 'the_geom_populated'

        db.run(%Q{
         ALTER TABLE #{qualified_table_name} ADD #{temp_finished_column} BOOLEAN DEFAULT FALSE;
        })
        db.run(%Q{
          CREATE INDEX idx_#{temp_finished_column} ON #{qualified_table_name} (#{temp_finished_column})
        })

        total_rows_processed = 0
        affected_rows_count = 0

        begin
          affected_rows_count = db.execute(%Q{
            UPDATE #{qualified_table_name}
            SET
              the_geom = public.ST_GeomFromText(
                'POINT(' || trim(CAST("#{longitude_column_name}" AS text)) || ' ' ||
                  trim(CAST("#{latitude_column_name}" AS text)) || ')', 4326
              ),
              #{temp_finished_column} = TRUE
            WHERE trim(CAST("#{longitude_column_name}" AS text)) ~
              '^(([-+]?(([0-9]|[1-9][0-9]|1[0-7][0-9])(\.[0-9]+)?))|[-+]?180)$'
            AND trim(CAST("#{latitude_column_name}" AS text))  ~
              '^(([-+]?(([0-9]|[1-8][0-9])(\.[0-9]+)?))|[-+]?90)$'
            AND #{id_column} IN (
              SELECT #{id_column} FROM #{qualified_table_name} WHERE #{temp_finished_column} != TRUE LIMIT #{batch_size}
            )
          })
          total_rows_processed = total_rows_processed + affected_rows_count
          job.log "Total processed: #{total_rows_processed}"
        end while affected_rows_count > 0

        db.run(%Q{
         ALTER TABLE #{qualified_table_name} DROP #{temp_finished_column};
        })
      end #populate_the_geom_from_latlon

      def create_the_geom_in(table_name)
        job.log 'Creating the_geom column'
        return false if column_exists_in?(table_name, 'the_geom')

        db.run(%Q{
          SELECT public.AddGeometryColumn(
            '#{schema}','#{table_name}','the_geom',4326,'geometry',2
          );
        })
      end #create_the_geom_in

      def column_exists_in?(table_name, column_name)
        columns_in(table_name).include?(column_name.to_sym)
      end #column_exists_in?

      def columns_in(table_name)
        db.schema(table_name, reload: true, schema: schema).map(&:first)
      end #columns_in

      def latitude_column_name_in
        names = LATITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        name  = find_column_in(table_name, names)
        job.log "Identified #{name} as latitude column" if name
        name
      end #latitude_column_name_in

      def longitude_column_name_in
        names = LONGITUDE_POSSIBLE_NAMES.map { |name| "'#{name}'" }.join(',')
        name = find_column_in(table_name, names)
        job.log "Identified #{name} as longitude column" if name
        name
      end #longitude_column_name_in

      def geometry_column_in
        names = geometry_columns.map { |name| "'#{name}'" }.join(',')
        find_column_in(table_name, names)
      end #geometry_column_in

      def drop_the_geom_webmercator
        return self unless column_exists_in?(table_name, THE_GEOM_WEBMERCATOR)

        job.log 'Dropping the_geom_webmercator column'
        column = Column.new(db, table_name, THE_GEOM_WEBMERCATOR, schema, job)
        column.drop
      end #drop_the_geom_webmercator

      def raise_if_geometry_collection
        column = Column.new(db, table_name, :the_geom, schema, job)
        return self unless column.geometry_type == 'GEOMETRYCOLLECTION'
        raise GeometryCollectionNotSupportedError
      end #raise_if_geometry_collection

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
      end #find_column_in

      def handle_multipoint(qualified_table_name)
        batched_execute(
          'Converting detected multipoint to point',
          %Q{
            UPDATE #{qualified_table_name}
            SET the_geom = ST_GeometryN(the_geom, 1)
          }
        )
      end #handle_multipoint

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
      end #multipoint?

      private

      attr_reader :db, :table_name, :schema, :job, :geometry_columns

      def batched_execute(log_message, convert_query, batch_size=DEFAULT_BATCH_SIZE)
        job.log log_message

        total_rows_processed = 0
        affected_rows_count = 0
        id_column = 'ogc_fid' # Only PostGIS driver (but can be changed, @see http://www.gdal.org/ogr/drv_pg.html)
        temp_finished_column = 'converted_row_flag'

        batching_query_fragment = %Q{
          , #{temp_finished_column} = TRUE
          WHERE #{id_column} IN (
            SELECT #{id_column} FROM #{qualified_table_name} WHERE #{temp_finished_column} != TRUE LIMIT #{batch_size}
          )
        }

        db.run(%Q{
         ALTER TABLE #{qualified_table_name} ADD #{temp_finished_column} BOOLEAN DEFAULT FALSE;
        })
        db.run(%Q{
          CREATE INDEX idx_#{temp_finished_column} ON #{qualified_table_name} (#{temp_finished_column})
        })

        begin
          begin
            affected_rows_count = db.execute(convert_query + batching_query_fragment)
            total_rows_processed = total_rows_processed + affected_rows_count
            job.log "Total processed: #{total_rows_processed}"
          rescue => exception
            job.log exception.to_s
            job.log '---------------------------'
            job.log "Total processed:#{total_rows_processed}\nQUERY:\n#{convert_query}#{batching_query_fragment}"
            job.log '---------------------------'
            job.log exception.backtrace
            job.log '---------------------------'
            affected_rows_count = -1
          end
        end while affected_rows_count > 0

        db.run(%Q{
         ALTER TABLE #{qualified_table_name} DROP #{temp_finished_column};
        })

        job.log "FINISHED: #{log_message}"
      end #batched_execute

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end #qualified_table_name
    end # Georeferencer
  end # Importer2
end # CartoDB


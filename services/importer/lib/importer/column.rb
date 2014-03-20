# encoding: utf-8
require_relative './job'
require_relative './string_sanitizer'
require_relative './exceptions'

module CartoDB
  module Importer2
    class Column
      DEFAULT_BATCH_SIZE = 50000
      DEFAULT_SRID    = 4326
      WKB_RE          = /^\d{2}/
      GEOJSON_RE      = /{.*\"type\".*\"coordinates\"/
      WKT_RE          = /POINT|LINESTRING|POLYGON/
      KML_MULTI_RE    = /<Line|<Polygon/
      KML_POINT_RE    = /<Point>/
      DEFAULT_SCHEMA  = 'cdb_importer'
      RESERVED_WORDS  = %w{ ALL ANALYSE ANALYZE AND ANY ARRAY AS ASC ASYMMETRIC
                            AUTHORIZATION BETWEEN BINARY BOTH CASE CAST CHECK
                            COLLATE COLUMN CONSTRAINT CREATE CROSS CURRENT_DATE 
                            CURRENT_ROLE CURRENT_TIME CURRENT_TIMESTAMP
                            CURRENT_USER DEFAULT DEFERRABLE DESC DISTINCT DO 
                            ELSE END EXCEPT FALSE FOR FOREIGN FREEZE FROM FULL
                            GRANT GROUP HAVING ILIKE IN INITIALLY INNER INTERSECT
                            INTO IS ISNULL JOIN LEADING LEFT LIKE LIMIT LOCALTIME
                            LOCALTIMESTAMP NATURAL NEW NOT NOTNULL NULL OFF
                            OFFSET OLD ON ONLY OR ORDER OUTER OVERLAPS PLACING
                            PRIMARY REFERENCES RIGHT SELECT SESSION_USER SIMILAR
                            SOME SYMMETRIC TABLE THEN TO TRAILING TRUE UNION
                            UNIQUE USER USING VERBOSE WHEN WHERE XMIN XMAX }

      def initialize(db, table_name, column_name, schema=DEFAULT_SCHEMA,
      job=nil)
        @job          = job || Job.new
        @db           = db
        @table_name   = table_name.to_sym
        @column_name  = column_name.to_sym
        @schema       = schema
      end #initialize

      def type
        db.schema(table_name, reload: true, schema: schema)
          .select { |column_details|
            column_details.first == column_name
          }.last.last.fetch(:db_type)
      end #type

      def geometrify
        job.log 'geometrifying'
        raise                     if empty?
        convert_from_wkt          if wkt?
        convert_from_kml_multi    if kml_multi?
        convert_from_kml_point    if kml_point?
        convert_from_geojson      if geojson?
        cast_to('geometry')
        convert_to_2d
        job.log 'geometrified'
        self
      end #geometrify

      def batched_convert(log_message, convert_query, batch_size=DEFAULT_BATCH_SIZE)
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
      end #batched_convert

      def convert_from_wkt
        batched_convert(
          'Converting geometry from WKT to WKB',
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_GeomFromText(#{column_name}, #{DEFAULT_SRID})
          }
        )
        self
      end #convert_from_wkt

      def convert_from_geojson
        batched_convert(
          'Converting geometry from GeoJSON to WKB',
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_SetSRID(public.ST_GeomFromGeoJSON(#{column_name}), #{DEFAULT_SRID})
          }
        )
        self
      end #convert_from_geojson

      def convert_from_kml_point
        batched_convert(
          'Converting geometry from KML point to WKB',
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_SetSRID(public.ST_GeomFromKML(#{column_name}),#{DEFAULT_SRID})
          }
        )
      end #convert_from_kml_point

      def convert_from_kml_multi
        batched_convert(
          'Converting geometry from KML multi to WKB',
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_SetSRID(public.ST_Multi(public.ST_GeomFromKML(#{column_name})),#{DEFAULT_SRID})
          }
        )
      end #convert_from_kml_multi

      def convert_to_2d
        batched_convert(
          'Converting to 2D point',
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_Force_2D(#{column_name})
          }
        )
      end #convert_to_2d

      def wkb?
        !!(sample.to_s =~ WKB_RE)
      end #wkb?

      def wkt?
        !!(sample.to_s =~ WKT_RE)
      end #wkt?

      def geojson?
        !!(sample.to_s =~ GEOJSON_RE)
      end #geojson?

      def kml_point?
        !!(sample.to_s =~ KML_POINT_RE)
      end #kml_point?

      def kml_multi?
        !!(sample.to_s =~ KML_MULTI_RE)
      end #kml_multi?

      def cast_to(type)
        job.log "casting #{column_name} to #{type}"
        db.run(%Q{
          ALTER TABLE #{qualified_table_name}
          ALTER #{column_name}
          TYPE #{type}
          USING #{column_name}::#{type}
        })
        self
      end #cast_to

      def sample
        return nil if empty?
        records_with_data.first.fetch(column_name)
      end #sample

      def empty?
        records_with_data.empty?
      end #empty?

      def records_with_data
        @records_with_data ||= db[%Q{
          SELECT #{column_name} FROM "#{schema}"."#{table_name}"
          WHERE #{column_name} IS NOT NULL 
          AND #{column_name} != ''
        }]
      end #records_with_data

      def rename_to(new_name)
        return self if new_name.to_s == column_name.to_s

        job.log "Renaming column #{column_name} TO #{new_name}"

        db.run(%Q{
          ALTER TABLE "#{schema}"."#{table_name}"
          RENAME COLUMN "#{column_name}" TO "#{new_name}"
        })
        @column_name = new_name
      end #rename_to

      def geometry_type
        sample = db[%Q{
          SELECT public.GeometryType(ST_Force_2D(#{column_name})) 
          AS type
          FROM #{schema}.#{table_name}
          WHERE #{column_name} IS NOT NULL
          LIMIT 1
        }].first
        sample && sample.fetch(:type)
      end #geometry_type

      def drop
        db.run(%Q{
          ALTER TABLE #{qualified_table_name} 
          DROP COLUMN IF EXISTS #{column_name} 
        })
      end #drop

      # Replace empty strings by nulls to avoid cast errors
      def empty_lines_to_nulls
        job.log 'replace empty strings by nulls?'
        column_id = column_name.to_sym
        column_type = nil
        db.schema(table_name).each do |colid, coldef|
          if colid == column_id
            column_type = coldef[:type]
          end
        end
        if column_type != nil && column_type == :string
          job.log 'string column found, replacing'
          total_rows_processed = 0
          affected_rows_count = 0
          id_column = 'ogc_fid' # Only PostGIS driver (but can be changed, @see http://www.gdal.org/ogr/drv_pg.html)
          temp_finished_column = 'converted_row_flag'

          db.run(%Q{
           ALTER TABLE #{qualified_table_name} ADD #{temp_finished_column} BOOLEAN DEFAULT FALSE;
          })
          db.run(%Q{
            CREATE INDEX idx_#{temp_finished_column} ON #{qualified_table_name} (#{temp_finished_column})
          })

          query = %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name}=NULL,
            #{temp_finished_column} = TRUE
            WHERE #{column_name}=''
            AND #{id_column} IN (
              SELECT #{id_column} FROM #{qualified_table_name} WHERE #{temp_finished_column} != TRUE LIMIT #{DEFAULT_BATCH_SIZE}
            )
          }

          begin
            begin
              affected_rows_count = db.execute(query)
              total_rows_processed = total_rows_processed + affected_rows_count
              job.log "Total processed: #{total_rows_processed}"
            rescue => exception
              job.log exception.to_s
              job.log '---------------------------'
              job.log "Total processed:#{total_rows_processed}\nQUERY:\n#{query}"
              job.log '---------------------------'
              job.log exception.backtrace
              job.log '---------------------------'
              affected_rows_count = -1
            end
          end while affected_rows_count > 0

          db.run(%Q{
           ALTER TABLE #{qualified_table_name} DROP #{temp_finished_column};
          })
        else
          job.log 'no string column found, nothing replaced'
        end
      end #empty_lines_to_nulls

      def sanitize
        rename_to(sanitized_name)
      end #sanitize

      def sanitized_name
        name = StringSanitizer.new.sanitize(column_name.to_s)
        return name unless reserved?(name) || unsupported?(name)
        return "_#{name}"
      end #sanitized_name

      def reserved?(name)
        RESERVED_WORDS.include?(name.upcase)
      end #reserved?

      def unsupported?(name)
        name !~ /^[a-zA-Z_]/
      end #unsupported?

      private

      attr_reader :job, :db, :table_name, :column_name, :schema

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end #qualified_table_name
    end # Column
  end # Importer2
end # CartoDB


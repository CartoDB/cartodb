# encoding: utf-8

require 'active_support/time'

require_relative './job'
require_relative './string_sanitizer'
require_relative './exceptions'
require_relative './query_batcher'

module CartoDB
  module Importer2
    class Column
      DEFAULT_SRID    = 4326
      WKB_RE          = /^\d{2}/
      GEOJSON_RE      = /{.*\"type\".*\"coordinates\"/
      WKT_RE          = /POINT|LINESTRING|POLYGON/
      KML_MULTI_RE    = /<Line|<Polygon/
      KML_POINT_RE    = /<Point>/
      DEFAULT_SCHEMA  = 'cdb_importer'
      DIRECT_STATEMENT_TIMEOUT = 1.hour * 1000
      # @see config/initializers/carto_db.rb -> POSTGRESQL_RESERVED_WORDS
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
                            UNIQUE USER USING VERBOSE WHEN WHERE XMIN XMAX
                            FORMAT CONTROLLER ACTION
                          }

      def initialize(db, table_name, column_name, user, schema = DEFAULT_SCHEMA, job = nil, logger = nil, capture_exceptions = true)
        @job          = job || Job.new({logger: logger})
        @db           = db
        @table_name   = table_name.to_sym
        @column_name  = column_name.to_sym
        @schema       = schema
        @capture_exceptions = capture_exceptions
        @user = user

        @from_geojson_with_transform = false
      end

      def mark_as_from_geojson_with_transform
        @from_geojson_with_transform = true
      end

      def type
        db.schema(table_name, reload: true, schema: schema)
          .select { |column_details|
            column_details.first == column_name
          }.last.last.fetch(:db_type)
      end

      def geometrify
        job.log 'geometrifying'
        raise "empty column #{column_name}" if empty?
        convert_from_wkt                    if wkt?
        convert_from_kml_multi              if kml_multi?
        convert_from_kml_point              if kml_point?
        convert_from_geojson_with_transform if geojson? && @from_geojson_with_transform
        convert_from_geojson                if geojson?

        cast_to('geometry')
        convert_to_2d
        job.log 'geometrified'
        self
      end

      def convert_from_wkt
        #TODO: @capture_exceptions
        job.log 'Converting geometry from WKT to WKB'
        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET #{column_name} = ST_GeomFromText(#{column_name}, #{DEFAULT_SRID})
                                 })
        end
        self
      end

      def convert_from_geojson_with_transform
        # 1) cast to proper null the geom column
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET #{column_name} = NULL
          WHERE #{column_name} = ''
        })

        # 2) Normal geojson behavior
        #TODO: @capture_exceptions
        job.log 'Converting geometry from GeoJSON with transform to WKB'
        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET #{column_name} = public.ST_SetSRID(public.ST_GeomFromGeoJSON(#{column_name}), #{DEFAULT_SRID})
                                 })
        end

        self
      end

      def convert_from_geojson
        #TODO: @capture_exceptions
        job.log 'Converting geometry from GeoJSON to WKB'
        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET #{column_name} = public.ST_SetSRID(public.ST_GeomFromGeoJSON(#{column_name}), #{DEFAULT_SRID})
                                 })
        end

        self
      end

      def convert_from_kml_point
        #TODO: @capture_exceptions
        job.log 'Converting geometry from KML point to WKB'
        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET #{column_name} = public.ST_SetSRID(public.ST_GeomFromKML(#{column_name}),#{DEFAULT_SRID})
                                 })
        end
      end

      def convert_from_kml_multi
        #TODO: @capture_exceptions
        job.log 'Converting geometry from KML multi to WKB'
        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET #{column_name} = public.ST_SetSRID(public.ST_Multi(public.ST_GeomFromKML(#{column_name})),#{DEFAULT_SRID})
                                 })
        end
      end

      def convert_to_2d
        #TODO: @capture_exceptions
        job.log 'Converting to 2D point'

        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET #{column_name} = public.ST_Force2D(#{column_name})
                                 })
        end

      end

      def wkb?
        !!(sample.to_s =~ WKB_RE)
      end

      def wkt?
        !!(sample.to_s =~ WKT_RE)
      end

      def geojson?
        !!(sample.to_s =~ GEOJSON_RE)
      end

      def kml_point?
        !!(sample.to_s =~ KML_POINT_RE)
      end

      def kml_multi?
        !!(sample.to_s =~ KML_MULTI_RE)
      end

      def cast_to(type)
        job.log "casting #{column_name} to #{type}"

        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                    ALTER TABLE #{qualified_table_name}
                                    ALTER #{column_name}
                                    TYPE #{type}
                                    USING #{column_name}::#{type}
                                  })
        end
        self
      end

      def sample
        return nil if empty?
        records_with_data.first.fetch(column_name)
      end

      def empty?
        records_with_data.empty?
      end

      def records_with_data
        @records_with_data ||= db[%Q{
          SELECT #{column_name} FROM "#{schema}"."#{table_name}"
          WHERE #{column_name} IS NOT NULL
          AND #{column_name}::text != ''
          LIMIT 1
        }]
      end

      def rename_to(new_name)
        return self if new_name.to_s == column_name.to_s

        job.log "Renaming column #{column_name} TO #{new_name}"

        db.run(%Q{
          ALTER TABLE "#{schema}"."#{table_name}"
          RENAME COLUMN "#{column_name}" TO "#{new_name}"
        })
        @column_name = new_name
      end

      def geometry_type
        sample = db[%Q{
          SELECT public.GeometryType(ST_Force2D(#{column_name}::geometry))
          AS type
          FROM #{schema}.#{table_name}
          WHERE #{column_name} IS NOT NULL
          LIMIT 1
        }].first
        sample && sample.fetch(:type)
      end

      def drop
        db.run(%Q{
          ALTER TABLE #{qualified_table_name}
          DROP COLUMN IF EXISTS #{column_name}
        })
      end

      # Replace empty strings by nulls to avoid cast errors
      def empty_lines_to_nulls
        # first timeout crash
        job.log 'replace empty strings by nulls?'
        column_id = column_name.to_sym
        column_type = nil
        db.schema(table_name).each do |colid, coldef|
          if colid == column_id
            column_type = coldef[:type]
          end
        end
        if column_type != nil && column_type == :string
          #TODO: @capture_exceptions
          job.log 'string column found, replacing'
          @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
            user_direct_conn.run(%Q{
                   UPDATE #{qualified_table_name}
                   SET #{column_name}=NULL
                   WHERE #{column_name}=''
                 })
          end
        else
          job.log 'no string column found, nothing replaced'
        end
      end

      def sanitize
        rename_to(sanitized_name)
      end

      def sanitized_name
        name = StringSanitizer.new.sanitize(column_name.to_s)
        return name unless reserved?(name) || unsupported?(name)
        "_#{name}"
      end

      def reserved?(name)
        RESERVED_WORDS.include?(name.upcase)
      end

      def unsupported?(name)
        name !~ /^[a-zA-Z_]/
      end

      private

      attr_reader :job, :db, :table_name, :column_name, :schema

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end
    end
  end
end


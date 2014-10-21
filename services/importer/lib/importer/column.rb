# encoding: utf-8
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

      def initialize(db, table_name, column_name, schema = DEFAULT_SCHEMA, job = nil, logger = nil, capture_exceptions = true)
        @job          = job || Job.new({logger: logger})
        @db           = db
        @table_name   = table_name.to_sym
        @column_name  = column_name.to_sym
        @schema       = schema
        @capture_exceptions = capture_exceptions

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
        raise                               if empty?
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
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = ST_GeomFromText(#{column_name}, #{DEFAULT_SRID})
          },
          qualified_table_name,
          job,
          'Converting geometry from WKT to WKB',
          @capture_exceptions
        )
        self
      end

      def convert_from_geojson_with_transform
        temp_col = 'temporal_the_geom'
        threshold = 150000              #hectares

        # 1) Add temp column for storing temporal geometries
        db.run(%Q{
         ALTER TABLE #{qualified_table_name} ADD #{temp_col} geometry DEFAULT NULL;
        })

        # 2) Cast to proper null the geom column
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET #{column_name} = NULL
          WHERE #{column_name} = ''
        })

        # 3) Populate temp column, empty the_geom
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET #{temp_col} = ST_Envelope(
              ST_SetSRID(
                ST_GeomFromGeoJSON(#{column_name})
              , #{DEFAULT_SRID})
            ),
            #{column_name} = NULL
            #{CartoDB::Importer2::QueryBatcher::QUERY_WHERE_PLACEHOLDER}
            WHERE
              #{column_name} IS NOT NULL
              #{CartoDB::Importer2::QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
          },
          qualified_table_name,
          job,
          'Creating temporally geometry to convert from GeoJSON',
          @capture_exceptions
        )

        # 4) delete geometries with bounding boxes greater than allowed threshold
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET
              #{temp_col} = NULL
            #{CartoDB::Importer2::QueryBatcher::QUERY_WHERE_PLACEHOLDER}
            WHERE
              #{temp_col} IS NOT NULL
              AND ST_area(#{temp_col}::geography)/10000 > #{threshold}
              #{CartoDB::Importer2::QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
          },
          qualified_table_name,
          job,
          'Removing too big bounding boxes',
          @capture_exceptions
        )

        # 5) grab random point inside valid bounding boxes and store into the_geom
        begin
          QueryBatcher::execute(
              db,
              %Q{
              UPDATE #{qualified_table_name}
              SET #{column_name} =
                ST_SetSRID(
                  ST_MakePoint(
                    ST_XMin(#{temp_col}) + (ST_XMax(#{temp_col}) - ST_XMin(#{temp_col})) * random(),
                    ST_YMin(#{temp_col}) + (ST_YMax(#{temp_col}) - ST_YMin(#{temp_col})) * random()
                  )
                , #{DEFAULT_SRID})
              #{CartoDB::Importer2::QueryBatcher::QUERY_WHERE_PLACEHOLDER}
              WHERE
                ST_GeometryType(#{temp_col}) = 'ST_Polygon'
                #{CartoDB::Importer2::QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
            },
              qualified_table_name,
              job,
              'Converting geometry from GeoJSON (transforming polygons to points) to WKB',
              @capture_exceptions
          )
        rescue => exception
          job.log "Error generating points inside bounding boxes: #{exception.to_s}"
        end

        # 6) copy normal points into the_geom
        QueryBatcher::execute(
          db,
          %Q{
          UPDATE #{qualified_table_name}
          SET #{column_name} =
            ST_SetSRID(#{temp_col}, #{DEFAULT_SRID})
          #{CartoDB::Importer2::QueryBatcher::QUERY_WHERE_PLACEHOLDER}
          WHERE
            ST_GeometryType(#{temp_col}) = 'ST_Point'
            #{CartoDB::Importer2::QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
          },
          qualified_table_name,
          job,
          'Converting geometry from GeoJSON (transforming points) to WKB',
          @capture_exceptions
        )

        # 7) Remove temp column
        db.run(%Q{
          ALTER TABLE #{qualified_table_name} DROP #{temp_col};
        })

        self
      end

      def convert_from_geojson
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_SetSRID(public.ST_GeomFromGeoJSON(#{column_name}), #{DEFAULT_SRID})
          },
          qualified_table_name,
          job,
          'Converting geometry from GeoJSON to WKB',
          @capture_exceptions
        )
        self
      end

      def convert_from_kml_point
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_SetSRID(public.ST_GeomFromKML(#{column_name}),#{DEFAULT_SRID})
          },
          qualified_table_name,
          job,
          'Converting geometry from KML point to WKB',
          @capture_exceptions
        )
      end

      def convert_from_kml_multi
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_SetSRID(public.ST_Multi(public.ST_GeomFromKML(#{column_name})),#{DEFAULT_SRID})
          },
          qualified_table_name,
          job,
          'Converting geometry from KML multi to WKB',
          @capture_exceptions
        )
      end

      def convert_to_2d
        QueryBatcher::execute(
          db,
          %Q{
            UPDATE #{qualified_table_name}
            SET #{column_name} = public.ST_Force_2D(#{column_name})
          },
          qualified_table_name,
          job,
          'Converting to 2D point',
          @capture_exceptions
        )
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
        db.run(%Q{
          ALTER TABLE #{qualified_table_name}
          ALTER #{column_name}
          TYPE #{type}
          USING #{column_name}::#{type}
        })
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
          AND #{column_name} != ''
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
          SELECT public.GeometryType(ST_Force_2D(#{column_name}))
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
        job.log 'replace empty strings by nulls?'
        column_id = column_name.to_sym
        column_type = nil
        db.schema(table_name).each do |colid, coldef|
          if colid == column_id
            column_type = coldef[:type]
          end
        end
        if column_type != nil && column_type == :string
          QueryBatcher::execute(
            db,
            %Q{
              UPDATE #{qualified_table_name}
              SET #{column_name}=NULL
              #{QueryBatcher::QUERY_WHERE_PLACEHOLDER}
              WHERE #{column_name}=''
              #{QueryBatcher::QUERY_LIMIT_SUBQUERY_PLACEHOLDER}
            },
            qualified_table_name,
            job,
            'string column found, replacing',
            @capture_exceptions
          )
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


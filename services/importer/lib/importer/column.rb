require 'active_support/time'

require_relative './job'
require_relative './string_sanitizer'
require_relative './exceptions'
require_relative './query_batcher'

require_relative '../../../../lib/carto/db/sanitize'

module CartoDB
  module Importer2
    class Column
      DEFAULT_SRID    = 4326
      WKB_RE          = /^\d{2}/
      GEOJSON_RE      = /{.*(type|coordinates).*(type|coordinates).*}/m
      WKT_RE          = /POINT|LINESTRING|POLYGON/
      KML_MULTI_RE    = /<Line|<Polygon/
      KML_POINT_RE    = /<Point>/
      DEFAULT_SCHEMA  = 'cdb_importer'
      DIRECT_STATEMENT_TIMEOUT = 1.hour * 1000
      RESERVED_COLUMN_NAMES = Carto::DB::Sanitize::RESERVED_COLUMN_NAMES
      PG_IDENTIFIER_MAX_LENGTH = Carto::DB::Sanitize::MAX_IDENTIFIER_LENGTH

      REJECTED_COLUMN_NAMES = Carto::DB::Sanitize::REJECTED_COLUMN_NAMES

      NO_COLUMN_SANITIZATION_VERSION = 0
      INITIAL_COLUMN_SANITIZATION_VERSION = 1
      CURRENT_COLUMN_SANITIZATION_VERSION = 2

      def initialize(db, table_name, column_name, user, schema = DEFAULT_SCHEMA, job = nil, logger = nil, capture_exceptions = true)
        @job          = job || Job.new({logger: logger})
        @db           = db
        @table_name   = table_name
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
                                 SET "#{column_name}" = ST_GeomFromText("#{column_name}", #{DEFAULT_SRID})
                                 })
        end
        self
      end

      def convert_from_geojson_with_transform
        # 1) cast to proper null the geom column
        db.run(%Q{
          UPDATE #{qualified_table_name}
          SET "#{column_name}" = NULL
          WHERE "#{column_name}" = ''
        })

        # 2) Normal geojson behavior
        #TODO: @capture_exceptions
        job.log 'Converting geometry from GeoJSON with transform to WKB'
        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET "#{column_name}" = public.ST_SetSRID(public.ST_GeomFromGeoJSON("#{column_name}"), #{DEFAULT_SRID})
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
                                 SET "#{column_name}" = public.ST_SetSRID(public.ST_GeomFromGeoJSON("#{column_name}"), #{DEFAULT_SRID})
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
                                 SET "#{column_name}" = public.ST_SetSRID(public.ST_GeomFromKML("#{column_name}"),#{DEFAULT_SRID})
                                 })
        end
      end

      def convert_from_kml_multi
        #TODO: @capture_exceptions
        job.log 'Converting geometry from KML multi to WKB'
        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET "#{column_name}" = public.ST_SetSRID(public.ST_Multi(public.ST_GeomFromKML("#{column_name}")),#{DEFAULT_SRID})
                                 })
        end
      end

      def convert_to_2d
        #TODO: @capture_exceptions
        job.log 'Converting to 2D point'

        @user.db_service.in_database_direct_connection(statement_timeout: DIRECT_STATEMENT_TIMEOUT) do |user_direct_conn|
          user_direct_conn.run(%Q{
                                 UPDATE #{qualified_table_name}
                                 SET "#{column_name}" = public.ST_Force2D("#{column_name}")
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
                                    ALTER "#{column_name}"
                                    TYPE #{type}
                                    USING "#{column_name}"::#{type}
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
          SELECT "#{column_name}" FROM "#{schema}"."#{table_name}"
          WHERE "#{column_name}" IS NOT NULL
          AND "#{column_name}"::text != ''
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
          SELECT public.GeometryType(ST_Force2D("#{column_name}"::geometry))
          AS type
          FROM #{schema}.#{table_name}
          WHERE "#{column_name}" IS NOT NULL
          LIMIT 1
        }].first
        sample && sample.fetch(:type)
      end

      def drop
        db.run(%Q{
          ALTER TABLE #{qualified_table_name}
          DROP COLUMN IF EXISTS "#{column_name}"
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
                   SET "#{column_name}"=NULL
                   WHERE "#{column_name}"=''
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
        self.class.sanitize_name column_name
      end

      def self.reserved?(name)
        RESERVED_COLUMN_NAMES.include?(name.downcase)
      end

      def self.unsupported?(name)
        name !~ /^[a-zA-Z_]/
      end

      def self.reserved_or_unsupported?(name)
        reserved?(name) || unsupported?(name)
      end

      def self.sanitize_name(column_name)
        name = StringSanitizer.sanitize(column_name.to_s, transliterate_cyrillic: true)
        return name unless reserved_or_unsupported?(name)
        "_#{name}"
      end

      def self.rejected?(name)
        REJECTED_COLUMN_NAMES.include?(name) || name =~ /^[0-9]/
      end

      def self.get_valid_column_name(candidate_column_name, column_sanitization_version, column_names)
        return candidate_column_name if column_sanitization_version == NO_COLUMN_SANITIZATION_VERSION

        existing_names = column_names - [candidate_column_name]

        if column_sanitization_version == INITIAL_COLUMN_SANITIZATION_VERSION
          get_valid_column_name_v1(candidate_column_name, existing_names)
        elsif column_sanitization_version == 2
          get_valid_column_name_v2(candidate_column_name, existing_names)
        elsif column_sanitization_version == 3
          get_valid_column_name_v3(candidate_column_name, existing_names)
        else
          raise "Invalid column sanitization version #{column_sanitization_version.inspect}"
        end
      end

      private

      def self.get_valid_column_name_v1(candidate_column_name, existing_names)
        # NOTE: originally not all uses of this sanitization version applied reserved words
        # reserved_words = RESERVED_COLUMN_NAMES
        reserved_words = []

        candidate_column_name = 'untitled_column' if candidate_column_name.blank?
        candidate_column_name = candidate_column_name.to_s.squish

        # Subsequent characters can be letters, underscores or digits
        candidate_column_name = candidate_column_name.gsub(/[^a-z0-9]/,'_').gsub(/_{2,}/, '_')

        # Valid names start with a letter or an underscore
        candidate_column_name = "column_#{candidate_column_name}" unless candidate_column_name[/^[a-z_]{1}/]

        avoid_collisions(candidate_column_name, existing_names, reserved_words)
      end

      def self.get_valid_column_name_v2(candidate_column_name, existing_names)
        new_column_name = sanitize_name(candidate_column_name).gsub(/_{2,}/, '_')
        new_column_name = [0, PG_IDENTIFIER_MAX_LENGTH] if new_column_name.size > PG_IDENTIFIER_MAX_LENGTH
        avoid_collisions(new_column_name, existing_names, RESERVED_COLUMN_NAMES)
      end

      def self.get_valid_column_name_v3(candidate_column_name, existing_names)
          # experimental sanitization
          # this can be configured using the locale files for the current (I18n.locale) locale;
          # for example, for I18n.locale == :en we could add this to config/locales/en.yml
          #   en:
          #     i18n:
          #      transliterate:
          #        rule:
          #          Ж: Zh
          #          ж: zh
          new_column_name = candidate_column_name.parameterize.tr('-','_')
          new_column_name = [0, PG_IDENTIFIER_MAX_LENGTH] if new_column_name.size > PG_IDENTIFIER_MAX_LENGTH
          avoid_collisions(new_column_name, existing_names, RESERVED_COLUMN_NAMES)
      end

      def self.avoid_collisions(name, existing_names, reserved_words, max_length=PG_IDENTIFIER_MAX_LENGTH)
        count = 1
        new_name = name
        while existing_names.include?(new_name) || reserved_words.include?(new_name.downcase)
          suffix = "_#{count}"
          new_name = name[0..max_length-suffix.length] + suffix
          count += 1
        end
        new_name
      end

      attr_reader :job, :db, :table_name, :column_name, :schema

      def qualified_table_name
        %Q("#{schema}"."#{table_name}")
      end
    end
  end
end


module Carto
  module DB
    module Sanitize
      PREFIX_REPLACEMENT = 'table_'.freeze
      SUFFIX_REPLACEMENT = '_t'.freeze
      CHARACTER_REPLACEMENT = '_'.freeze
      # See https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
      MAX_IDENTIFIER_LENGTH = 63
      DISALLOWED_STARTING_CHARACTERS_REGEX = /^[^a-z]+/
      DISALLOWED_CHARACTERS_REGEX = /[^a-z|_|0-9]/
      REPEATED_UNDERSCORES_REGEX = /_{2,}/
      # PG12_DEPRECATED raster, raster_overviews and raster_columns not supported in postgis 3+
      SYSTEM_TABLE_NAMES    = %w(spatial_ref_sys geography_columns geometry_columns raster_columns raster_overviews
                                 cdb_tablemetadata geometry raster).freeze
      RESERVED_TABLE_NAMES  = %w(layergroup all public).freeze

      # See https://www.postgresql.org/docs/current/ddl-system-columns.html
      SYSTEM_COLUMN_NAMES   = %w(tableoid xmin cmin xmax cmax ctid).freeze

      # See https://www.postgresql.org/docs/current/sql-keywords-appendix.html
      RESERVED_WORDS        = %w(all analyse analyze and any array as asc asymmetric authorization binary both
                                 case cast check collate collation column concurrently constraint create cross
                                 current_catalog current_date current_role current_schema current_time
                                 current_timestamp current_user default deferrable desc distinct do else end
                                 except false fetch for foreign freeze from full grant group having ilike in
                                 initially inner intersect into is isnull join lateral leading left like limit
                                 localtime localtimestamp natural not notnull null offset on only or order outer
                                 overlaps placing primary references returning right select session_user similar
                                 some symmetric table tablesample then to trailing true union unique user using
                                 variadic verbose when where window with).freeze

      ADDITIONAL_RESERVED_COLUMNS = %w(oid ogc_fid).freeze

      REJECTED_COLUMN_NAMES = (SYSTEM_COLUMN_NAMES + ADDITIONAL_RESERVED_COLUMNS).freeze

      # FIXME we have been reserving these name in columns but I don't know the reason ¯\_(ツ)_/¯
      ADDITIONAL_WORDS      = %w(between new off old format controller action).freeze

      RESERVED_COLUMN_NAMES = SYSTEM_COLUMN_NAMES + RESERVED_WORDS + ADDITIONAL_WORDS


      def self.append_with_truncate_and_sanitize(identifier, suffix)
        suffix_length = suffix.length

        unless suffix_length < MAX_IDENTIFIER_LENGTH
          raise "'#{suffix}' is too long (#{suffix_length} >= #{MAX_IDENTIFIER_LENGTH}) for append"
        end

        truncated_identifier = if identifier.length + suffix_length > MAX_IDENTIFIER_LENGTH
                                 identifier[0..(MAX_IDENTIFIER_LENGTH - suffix_length - 1)]
                               else
                                 identifier
                               end

        sanitize_identifier("#{truncated_identifier}#{suffix}")
      end

      def self.sanitize_identifier(identifier)
        # Make lowercase
        sanitized_identifier = identifier.downcase

        # Strip of starting or ending white spaces
        sanitized_identifier = sanitized_identifier.strip

        # Remove disallowed starting characters
        if sanitized_identifier =~ DISALLOWED_STARTING_CHARACTERS_REGEX
          sanitized_identifier = PREFIX_REPLACEMENT + sanitized_identifier
        end

        # Replace disallowed characters with '_'
        sanitized_identifier = sanitized_identifier.gsub(DISALLOWED_CHARACTERS_REGEX, CHARACTER_REPLACEMENT)

        # Remove repated '_'
        sanitized_identifier = sanitized_identifier.gsub(REPEATED_UNDERSCORES_REGEX, '_')

        # Make sure it's not too long
        sanitized_identifier = sanitized_identifier[0..(MAX_IDENTIFIER_LENGTH - 1)]

        # Append _t if is a reserved word or reserved table name
        # NOTE: strictly, we don't need to avoid ADDITIONAL_WORDS for table names
        if (RESERVED_WORDS + RESERVED_TABLE_NAMES + SYSTEM_TABLE_NAMES + ADDITIONAL_WORDS).map(&:downcase).include?(sanitized_identifier)
          sanitized_identifier += SUFFIX_REPLACEMENT
        end

        sanitized_identifier
      end
    end
  end
end

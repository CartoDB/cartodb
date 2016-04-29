# encoding: utf-8

module Carto
  module DB
    module Sanitize
      PREFIX_REPLACEMENT = 'table_'.freeze
      SUFFIX_REPLACEMENT = '_t'.freeze
      CHARACTER_REPLACEMENT = '_'.freeze
      MAX_IDENTIFIER_LENGTH = 63
      DISALLOWED_STARTING_CHARACTERS_REGEX = /^[^a-z]+/
      DISALLOWED_CHARACTERS_REGEX = /[^a-z|_|0-9]/
      REPEATED_UNDERSCORES_REGEX = /_{2,}/
      RESERVED_WORDS = %w(all analyse analyze and any array as asc asymmetric authorization between binary both case
                          cast check collate column constraint create cross current_date current_role current_time
                          current_timestamp current_user default deferrable desc distinct do else end except false for
                          foreign freeze from full grant group having ilike in initially inner intersect into is isnull
                          join leading left like limit localtime localtimestamp natural new not notnull null off offset
                          old on only or order outer overlaps placing primary references right select session_user
                          similar some symmetric table then to trailing true union unique user using verbose when where
                          xmin xmax).freeze
      SYSTEM_TABLE_NAMES = %w(spatial_ref_sys geography_columns geometry_columns raster_columns raster_overviews
                              cdb_tablemetadata geometry raster).freeze
      RESERVED_TABLE_NAMES = %w{ layergroup all public }.freeze

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
        sanitized_identifier = if sanitized_identifier =~ DISALLOWED_STARTING_CHARACTERS_REGEX
                                 PREFIX_REPLACEMENT + sanitized_identifier
                               end

        # Replace disallowed characters with '_'
        sanitized_identifier = sanitized_identifier.gsub(DISALLOWED_CHARACTERS_REGEX, CHARACTER_REPLACEMENT)

        # Remove repated '_'
        sanitized_identifier = sanitized_identifier.gsub!(REPEATED_UNDERSCORES_REGEX, '_')

        # Make sure it's not too long
        sanitized_identifier = sanitized_identifier[0..(MAX_IDENTIFIER_LENGTH - 1)]

        # Append _t if is a reserved word or reserved table name
        if (RESERVED_WORDS + RESERVED_TABLE_NAMES + SYSTEM_TABLE_NAMES).map(&:downcase).include?(sanitized_identifier)
          sanitized_identifier += SUFFIX_REPLACEMENT
        end

        sanitized_identifier
      end
    end
  end
end

# encoding: utf-8

module Carto
  module DB
    module Sanitize
      PREFIX_REPLACEMENT = ''.freeze
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
      SYSTEM_TABLE_NAMES = ['spatial_ref_sys',
                            'geography_columns',
                            'geometry_columns',
                            'raster_columns',
                            'raster_overviews',
                            'cdb_tablemetadata',
                            'geometry',
                            'raster'].freeze
      RESERVED_TABLE_NAMES = %w{ layergroup all public }.freeze

      def self.append_with_truncate_and_sanitize(identifier, suffix)
        identifier_length = identifier.length
        suffix_length = suffix.length

        truncated_identifier = if identifier_length + suffix_length > MAX_IDENTIFIER_LENGTH
                                 identifier[0..-suffix_length]
                               else
                                 identifier
                               end

        sanitize_identifier("#{truncated_identifier}#{suffix}")
      end

      def self.sanitize_identifier(identifier)
        # Make lowercase
        identifier.downcase!

        # Strip of starting or ending white spaces
        identifier.strip!

        # Remove disallowed starting characters
        identifier.gsub!(DISALLOWED_STARTING_CHARACTERS_REGEX, PREFIX_REPLACEMENT)

        # Replace disallowed characters with '_'
        identifier.gsub!(DISALLOWED_CHARACTERS_REGEX, CHARACTER_REPLACEMENT)

        # Remove repated '_'
        identifier.gsub!(REPEATED_UNDERSCORES_REGEX, '_')

        # Make sure it's not too long
        identifier = identifier[0..(MAX_IDENTIFIER_LENGTH - 1)]

        # Append _t if is a reserved word
        identifier += '_t' if RESERVED_WORDS.each(&:downcase).include?(identifier)

        identifier
      end
    end
  end
end

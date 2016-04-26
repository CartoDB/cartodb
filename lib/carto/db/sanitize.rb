# encoding: utf-8

module Carto
  module DB
    module Sanitize
      PREFIX_REPLACEMENT = ''.freeze
      CHARACTER_REPLACEMENT = '_'.freeze
      MAX_IDENTIFIER_LENGTH = 63
      DISALLOWED_STARTING_CHARACTERS_REGEX = /^[^a-z]+/
      DISALLOWED_CHARACTERS_REGEX = /[^a-z|_|0-9]/

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

        # Remove disallowed starting characters
        identifier.gsub!(DISALLOWED_STARTING_CHARACTERS_REGEX, PREFIX_REPLACEMENT)

        # Replace disallowed characters with '_'
        identifier.gsub!(DISALLOWED_CHARACTERS_REGEX, CHARACTER_REPLACEMENT)

        # Make sure it's not too long
        identifier[0..(MAX_IDENTIFIER_LENGTH - 1)]
      end
    end
  end
end

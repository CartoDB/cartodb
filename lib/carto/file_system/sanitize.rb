module Carto
  module FileSystem
    module Sanitize
      # Sanitize: NUL, slash, backslash, colon, asterisk, question, quote, less, greater, pipe
      DISALLOWED_CHARACTERS = /[\x00\/\\:\*\?\"<>\|]/

      def self.sanitize_identifier(identifier, replacement_character: '_')
        if replacement_character =~ DISALLOWED_CHARACTERS
          raise "Unsafe replacement character '#{replacement_character}'"
        else
          identifier.gsub(DISALLOWED_CHARACTERS, replacement_character)
        end
      end
    end
  end
end

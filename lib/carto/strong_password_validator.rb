# encoding utf-8

module Carto
  class StrongPasswordValidator
    DEFAULT_MIN_LENGTH = 8
    DEFAULT_MAX_LENGTH = 64
    DEFAULT_MIN_NUMBERS = 1
    DEFAULT_MIN_SYMBOLS = 1
    DEFAULT_MIN_LETTERS = 1

    SYMBOLS = %w({ } [ ] , . < > ; : ‘ “ \? \/ \| \ ` ~ ! @ # $ % ^ & \* ( ) _ - \+ =).freeze

    def initialize(min_length: DEFAULT_MIN_LENGTH,
                   max_length: DEFAULT_MAX_LENGTH,
                   min_letters: DEFAULT_MIN_NUMBERS,
                   min_symbols: DEFAULT_MIN_SYMBOLS,
                   min_numbers: DEFAULT_MIN_LETTERS)

      @min_length  = min_length
      @max_length  = max_length
      @min_letters = min_letters
      @min_symbols = min_symbols
      @min_numbers = min_numbers
    end

    def validate(password)
      password = '' if password.nil?

      errors = []

      if password.length < @min_length
        errors << "must be at least #{@min_length} #{'character'.pluralize(@min_length)} long"
      end

      if password.length > @max_length
        errors << "must be at most #{@max_length} #{'character'.pluralize(@max_length)} long"
      end

      if letters_in(password) < @min_letters
        errors << "must contain at least #{@min_letters} #{'letter'.pluralize(@min_letters)}"
      end

      if symbols_in(password) < @min_symbols && numbers_in(password) < @min_numbers
        errors << "must contain at least #{@min_symbols} #{'symbol'.pluralize(@min_symbols)} or " +
                  "#{@min_numbers} #{'number'.pluralize(@min_numbers)}"
      end

      errors
    end

    def formatted_error_message(errors)
      return nil if errors.empty?
      return errors.first if errors.size == 1

      message = errors.select { |error| error != errors.last }.join(', ')
      message << " and #{errors.last}"

      message
    end

    private

    def letters_in(string)
      string.scan(/[[:alpha:]]/).size
    end

    def symbols_in(string)
      string.scan(/[#{SYMBOLS.join('|')}]/).size
    end

    def numbers_in(string)
      string.scan(/\d/).size
    end
  end
end

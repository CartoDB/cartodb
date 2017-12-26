# encoding: utf-8

module MinimalValidator
  class Validator
    def initialize
      reset
    end

    def reset
      self.errors = {}
    end

    def valid?
      errors.empty?
    end

    def validate_presence_of(attributes)
      attributes.each do |attribute, value|
        if (value.nil? || value.empty?)
          errors.store(attribute.to_sym, "can't be blank")
        end
      end
    end

    def validate_presence_of_with_custom_message(attributes, custom_message)
      has_errors = false
      error_attribute = nil
      attributes.each do |attribute, value|
        if (value.nil? || value.empty?)
          error_attribute = attribute
          has_errors = true
        end
      end
      errors.store(error_attribute.to_sym, custom_message) if has_errors
    end

    def validate_available_name
      return self unless name_changed && user
    end

    def validate_in(attribute, value, whitelist)
      unless whitelist.include?(value)
        errors.store(attribute, "must be one of #{whitelist.join(', ')}")
      end
    end

    def validate_uniqueness_of(attribute, available)
      self.errors.store(attribute.to_sym, 'is already taken') unless available
    end

    def validate_expected_value(attribute, expected_value, actual_value)
      self.errors.store(attribute.to_sym, 'has invalid value') unless actual_value == expected_value
    end

    def full_errors
      errors.map { |attribute, message| "#{attribute} #{message}" }
    end

    attr_accessor :errors
  end
end

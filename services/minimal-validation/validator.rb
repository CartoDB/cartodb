# encoding: utf-8

module MinimalValidator
  class Validator
    def initialize
      self.errors = {}
    end #initialize

    def valid?
      errors.empty?
    end #valid?

    def validate_presence_of(attributes)
      attributes.each do |attribute, value|
        if (value.nil? || value.empty?)
          errors.store(attribute.to_sym, "can't be blank")
        end
      end
    end #validate_presence_of

    def validate_presence_of_with_custom_message(attributes, custom_message)
      has_errors = false
      attributes.each do |attribute, value|
        if (value.nil? || value.empty?)
          has_errors = true
        end
      end
      errors.store(custom_message) if has_errors
    end #validate_presence_of_with_custom_message

    def validate_available_name
      return self unless name_changed && user
    end #validate_available_name

    def validate_in(attribute, value, whitelist)
      unless whitelist.include?(value)
        errors.store(attribute, "must be one of #{whitelist.join(', ')}")
      end
    end #validate_in

    def validate_uniqueness_of(attribute, available)
      self.errors.store(attribute.to_sym, 'is already taken') unless available
    end #validate_uniqueness_of

    def full_errors
      errors.map { |attribute, message| "#{attribute} #{message}" }
    end #full_errors

    attr_reader :errors

    private

    attr_writer :errors
  end # Validator
end # MinimalValidator


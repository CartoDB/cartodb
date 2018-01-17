module Carto
  # Rails 3 stores nil strings with JSON serialization as 'null', so we need to replace it with a valid value.
  # See https://github.com/rails/rails/issues/13144
  class CartoJsonSerializer
    def self.dump(hash)
      hash.nil? ? nil : hash.to_json
    end

    def self.load(value)
      value.nil? ? nil : JSON.parse(value).with_indifferent_access
    end
  end

  # CartoJsonSerializer is closer to Rails Json serializer, using with_indifferent_access
  # for load. The problem with that is that although you can _access_ first
  # level keys both with symbols and keys, other common operations, such as
  # key comparison, fail, and it only applies to the first level.
  class CartoJsonSymbolizerSerializer < CartoJsonSerializer
    def self.load(value)
      value.nil? ? nil : JSON.parse(value, symbolize_names: true)
    end
  end
end

class CartoJsonSymbolizerValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    if value && !(value.is_a?(Hash) || value.is_a?(Array))
      record.errors[attribute] << 'wrongly formatted (not a Hash or invalid JSON)'
    end
  end
end

class JsonSchemaValidator < ActiveModel::EachValidator
  def validate_each(record, attribute, value)
    return unless value

    value_for_json = prepare_for_json(value)

    schema = Carto::Definition.instance.load_from_file("lib/formats/#{record.class.to_s.underscore}/#{attribute}.json")
    errors = JSON::Validator::fully_validate(schema, value_for_json, strict: true)
    record.errors[attribute] << errors.join(', ') if errors.any?
  end

  private

  def prepare_for_json(value)
    if value.is_a? Hash
      value.with_indifferent_access
    elsif value.respond_to? :map
      value.map { |v| prepare_for_json(v) }
    else
      value
    end
  end
end

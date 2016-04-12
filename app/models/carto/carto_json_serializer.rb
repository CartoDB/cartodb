module Carto
  # Rails 3 stores nil strings with JSON serialization as 'null', so we need to replace it with a valid value.
  # See https://github.com/rails/rails/issues/13144
  class CartoJsonSerializer
    def self.dump(hash)
      hash.nil? ? nil : hash.to_json
    end

    def self.load(value)
      value.nil? ? nil : JSON.parse(value).deep_symbolize_keys
    end
  end
end

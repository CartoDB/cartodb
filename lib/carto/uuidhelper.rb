require 'securerandom'

module Carto
  module UUIDHelper
    module_function

    UUID_REGEXP = Regexp.new("^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{2})([0-9a-f]{2})-([0-9a-f]{12})$")

    def uuid?(text)
      !(Regexp.new(%r{\A#{UUID_REGEXP}\Z}) =~ text).nil?
    end

    def random_uuid
      SecureRandom.uuid
    end
  end
end

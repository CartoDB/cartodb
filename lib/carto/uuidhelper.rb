require 'uuidtools'

module Carto
  module UUIDHelper

    def is_uuid?(text)
      !(Regexp.new(%r{\A#{UUIDTools::UUID_REGEXP}\Z}) =~ text).nil?
    end

    def random_uuid
      UUIDTools::UUID.timestamp_create.to_s
    end

  end
end

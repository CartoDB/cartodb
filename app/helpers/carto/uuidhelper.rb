require 'uuidtools'

module Carto
  module UUIDHelper

    def is_uuid?(text)
      !(Regexp.new(%r{\A#{UUIDTools::UUID_REGEXP}\Z}) =~ text).nil?
    end

  end
end

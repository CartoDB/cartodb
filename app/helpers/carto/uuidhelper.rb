module Carto
  module UUIDHelper

    def is_uuid?(text)
      !(UUIDTools::UUID_REGEXP =~ text).nil?
    end

  end
end

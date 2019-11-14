module Carto
  module Tracking
    module Formats
      class Hubspot
        def initialize(email: nil)
          @email = email
        end

        def to_hash
          @email ? { email: @email } : {}
        end
      end
    end
  end
end

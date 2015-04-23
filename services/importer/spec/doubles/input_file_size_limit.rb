
module CartoDB
  module Importer2
    module Doubles
      class InputFileSizeLimit
        def initialize(arguments={})
          @max_size = arguments.fetch(:max_size)
        end

        def is_over_limit!(size)
          size > @max_size
        end
      end
    end
  end
end

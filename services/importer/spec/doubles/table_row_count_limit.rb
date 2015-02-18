
module CartoDB
  module Importer2
    module Doubles
      class TableRowCountLimit
        def initialize(arguments={})
        end

        def is_over_limit!(size)
          false
        end
      end
    end
  end
end

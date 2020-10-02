module CartoDB
  module Importer2
    module Doubles
      class TableRowCountLimit

        def initialize(arguments={}); end

        def is_over_limit!(_size)
          false
        end

      end
    end
  end
end

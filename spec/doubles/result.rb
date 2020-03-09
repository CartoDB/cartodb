module CartoDB
    module Doubles
      module Importer2
        class Result
          def initialize(attributes={})
            self.table_name = attributes[:table_name]
            self.name = attributes[:name]
            self.support_tables = []
          end

          attr_accessor :support_tables, :table_name, :name

          def update_support_tables(new_list)
          end
      end
    end
  end
end


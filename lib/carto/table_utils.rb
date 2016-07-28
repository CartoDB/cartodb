module Carto
  module TableUtils
    def safe_table_name_quoting(table_name)
      dashes_quoting(table_name)
    end

    def safe_schema_name_quoting(schema_name)
      dashes_quoting(schema_name)
    end

    private

    def dashes_quoting(name)
      name && name.include?('-') ? "\"#{name}\"" : name
    end
  end
end

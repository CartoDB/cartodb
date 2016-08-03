module Carto
  module TableUtils
    # Returns a (double) quoted table name if needed (if it contains a dash, for example).
    # Coupled to lib/assets/javascripts/cartodb3/helpers/utils.js#safeTableNameQuoting
    def safe_table_name_quoting(table_name)
      can_be_quoted?(table_name) ? dashes_quoting(table_name) : table_name
    end

    def safe_schema_name_quoting(schema_name)
      can_be_quoted?(schema_name) ? dashes_quoting(schema_name) : schema_name
    end

    def safe_schema_and_table_quoting(schema_name, table_name)
      safe_schema = safe_schema_name_quoting(schema_name)
      safe_table_name = safe_table_name_quoting(table_name)
      "#{safe_schema}.#{safe_table_name}"
    end

    private

    ALREADY_QUOTED = /\A".*"\Z/
    NON_VALID_CHARACTERS = /[^[a-z][A-Z][0-9]_$]/

    def dashes_quoting(name)
      name && !name.match(ALREADY_QUOTED) && name =~ NON_VALID_CHARACTERS ? "\"#{name}\"" : name
    end

    def can_be_quoted?(name)
      name && !name.include?('.')
    end
  end
end

module Carto
  module TableUtils
    # Returns a (double) quoted table name if needed (if it contains a dash, for example).
    # Coupled to lib/assets/javascripts/builder/helpers/utils.js#safeTableNameQuoting
    def safe_table_name_quoting(table_name)
      can_be_quoted?(table_name) ? dashes_quoting(table_name) : table_name
    end

    def safe_schema_name_quoting(schema_name)
      can_be_quoted?(schema_name) ? dashes_quoting(schema_name) : schema_name
    end

    def safe_schema_and_table_quoting(schema_name, table_name)
      return nil if table_name.nil?

      safe_schema = safe_schema_name_quoting(schema_name)
      safe_table_name = safe_table_name_quoting(table_name)
      "#{safe_schema}.#{safe_table_name}"
    end

    private

    ALREADY_QUOTED = /\A".*"\Z/
    VALID_IDENTIFIER = /^[a-zA-Z_][a-zA-Z0-9_$]*$/

    def dashes_quoting(name)
      name && !name.match(ALREADY_QUOTED) && !name.match(VALID_IDENTIFIER) ? "\"#{name}\"" : name
    end

    def can_be_quoted?(name)
      name && !name.include?('.')
    end
  end
end

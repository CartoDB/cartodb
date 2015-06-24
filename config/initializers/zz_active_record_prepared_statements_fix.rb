require 'active_record'
require 'active_record/connection_adapters/postgresql_adapter'

# See https://github.com/rails/rails/pull/5872
# This can probably be removed in more up-to-date versions of rails
module ActiveRecord
  module ConnectionAdapters
    class PostgreSQLAdapter
      def table_exists?(name)
        schema, table = Utils.extract_schema_and_table(name.to_s)
        return false unless table

        binds = [[nil, table]]
        binds << [nil, schema] if schema

        exec_query(<<-SQL, 'SCHEMA').rows.first[0].to_i > 0
            SELECT COUNT(*)
            FROM pg_class c
            LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relkind in ('v','r')
            AND c.relname = '#{table.gsub(/(^"|"$)/,'')}'
            AND n.nspname = #{schema ? "'#{schema}'" : 'ANY (current_schemas(false))'}
        SQL
      end

      # Returns true if schema exists.
      def schema_exists?(name)
        exec_query(<<-SQL, 'SCHEMA').rows.first[0].to_i > 0
          SELECT COUNT(*)
          FROM pg_namespace
          WHERE nspname = '#{name}'
        SQL
      end

      def primary_key(table)
        row = exec_query(<<-end_sql, 'SCHEMA').rows.first
          SELECT DISTINCT(attr.attname)
          FROM pg_attribute attr
          INNER JOIN pg_depend dep ON attr.attrelid = dep.refobjid AND attr.attnum = dep.refobjsubid
          INNER JOIN pg_constraint cons ON attr.attrelid = cons.conrelid AND attr.attnum = cons.conkey[1]
          WHERE cons.contype = 'p'
            AND dep.refobjid = '#{table}'::regclass
        end_sql

        row && row.first
      end


      def serial_sequence(table, column)
        result = exec_query(<<-eosql, 'SCHEMA')
          SELECT pg_get_serial_sequence('#{table}', '#{column}')
        eosql
        result.rows.first.first
      end


      def last_insert_id(sequence_name) #:nodoc:
        r = exec_query("SELECT currval('#{sequence_name}')", 'SQL')
        Integer(r.rows.first.first)
      end

      def exec_query(sql, name = 'SQL', binds = [])
        log(sql, name, binds) do
          # INFO: monkeypatch disabling prepared statements
          #result = binds.empty? ? exec_no_cache(sql, binds) :
          #                        exec_cache(sql, binds)
          result = exec_no_cache(sql, binds)

          ret = ActiveRecord::Result.new(result.fields, result_as_array(result))
          result.clear
          return ret
        end
      end

    end
  end
end

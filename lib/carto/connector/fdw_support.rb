# encoding: utf-8

# Support methods to generate FDW-related SQL commands

module Carto
  class Connector
    module FdwSupport
      def fdw_create_server_sql(fdw, server_name, options)
        %{
          CREATE SERVER #{server_name}
            FOREIGN DATA WRAPPER #{fdw}
            #{options_clause(options)};
        }
      end

      def fdw_create_usermap_sql(server_name, user_name, options)
        %{
          CREATE USER MAPPING FOR "#{user_name}"
            SERVER #{server_name}
            #{options_clause(options)};
        }
      end

      def fdw_import_foreign_schema_sql(server_name, remote_schema_name, schema_name, options)
        %{
          IMPORT FOREIGN SCHEMA "#{remote_schema_name}"
            FROM SERVER #{server_name}
            INTO "#{schema_name}"
            #{options_clause(options)};
         }
      end

      def fdw_import_foreign_schema_limited_sql(server_name, remote_schema_name, schema_name, limited_to, options)
        %{
          IMPORT FOREIGN SCHEMA "#{remote_schema_name}"
            LIMIT TO (#{Array(limited_to).join(',')})
            FROM SERVER #{server_name}
            INTO "#{schema_name}"
            #{options_clause(options)};
         }
      end

      def fdw_grant_select_sql(schema_name, table_name, user_name)
        %{
          GRANT SELECT ON #{qualified_table_name(schema_name, table_name)} TO "#{user_name}";
         }
      end

      def fdw_create_foreign_table_sql(server_name, schema_name, table_name, columns, options)
        %{
          CREATE FOREIGN TABLE #{qualified_table_name(schema_name, table_name)} (#{columns * ','})
            SERVER #{server_name}
            #{options_clause(options)};
         }
      end

      def fdw_create_foreign_table_if_not_exists_sql(server_name, schema_name, table_name, columns, options)
        %{
          CREATE FOREIGN TABLE IF NOT EXISTS #{qualified_table_name(schema_name, table_name)} (#{columns * ','})
            SERVER #{server_name}
            #{options_clause(options)};
         }
      end

      def fdw_drop_server_sql(server_name, cascade: false)
        cascade_clause = cascade ? ' CASCADE' : ''
        "DROP SERVER IF EXISTS #{server_name}#{cascade_clause};"
      end

      def fdw_drop_usermap_sql(server_name, user_name)
        %{DROP USER MAPPING IF EXISTS FOR "#{user_name}" SERVER #{server_name};}
      end

      def fdw_drop_foreign_table_sql(schema_name, table_name)
        %{DROP FOREIGN TABLE IF EXISTS #{qualified_table_name(schema_name, table_name)};}
      end

      def fdw_rename_foreign_table_sql(schema, foreign_table_name, new_name)
        %{
          ALTER FOREIGN TABLE #{qualified_table_name(schema, foreign_table_name)}
          RENAME TO #{qualified_table_name(nil, new_name)};
        }
      end

      # This performs the same truncation PG does on too long table names
      def fdw_adjusted_table_name(name)
        name[0...PG_MAX_TABLE_NAME_LENGTH]
      end

      def fdw_qualified_table_name(schema_name, table_name)
        qualified_table_name(schema_name, table_name)
      end

      private

      PG_MAX_TABLE_NAME_LENGTH = 63
      def qualified_table_name(schema_name, table_name)
        name = []
        name << %{"#{schema_name}"} if schema_name.present?
        name << %{"#{table_name}"}
        name.join('.')
      end

      def quote_option_name(option)
        option = option.to_s
        if option && option.to_s.downcase != option.to_s
          %{"#{option}"}
        else
          option
        end
      end

      def options_clause(options)
        if options.present?
          options_list = options.map { |k, v| "#{quote_option_name k} '#{escape_single_quotes v}'" } * ",\n"
          "OPTIONS (#{options_list})"
        else
          ''
        end
      end

      def escape_single_quotes(text)
        text.to_s.gsub("'", "''")
      end
    end
  end
end

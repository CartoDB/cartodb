# coding: UTF-8
module CartoDB
  class SqlParser
    def initialize(query, options)
      @query      = query
      @connection = options[:connection]
    end

    # Returns the tables involved in a query
    def affected_tables
      statements.map do |statement|
        tables_per_statement = begin
          @connection["SELECT CDB_QueryTables(?)", statement].all
        rescue Sequel::DatabaseError => exception
          raise unless exception.message =~ /cannot explain query|does not exist/i
          []
        end
        tables_per_statement.map do |s|
          s[:cdb_querytables].split(',').map do |table_name|
            t = table_name.gsub!(/[\{\}]/, '')
            (t.blank? ? nil : t)
          end
        end
      end.flatten.compact.uniq
    end

    def statements
      @connection["SELECT CDB_QueryStatements(?)", @query].all.map do |s|
        s[:cdb_querystatements]
      end.flatten.compact.uniq
    end
  end
end

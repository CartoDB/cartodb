# coding: UTF-8
module CartoDB
  class SqlParser
    def initialize(query, options)
      @query      = query
      @connection = options[:connection]
    end

    # Returns the tables involved in a query
    def affected_tables
      tables_per_statement = @connection["SELECT CDB_QueryTables('#{@query}')"].all
      tables_per_statement.map do |s|
        s[:cdb_querytables].split(',').map do |table_name|
          table_name.gsub!(/[\{\}]/, '') 
        end
      end.flatten.compact.uniq
    end
  end
end

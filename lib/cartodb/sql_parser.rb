# coding: UTF-8
module CartoDB
  class SqlParser
    def initialize(query, options)
      @query      = query
      @connection = options[:connection]
    end

    # Returns the tables involved in a query
    def affected_tables
      query_tables = @connection["SELECT CDB_QueryTables(?)", @query].first
      query_tables[:cdb_querytables].split(',').map do |table_name|
        t = table_name.gsub!(/[\{\}]/, '')
        (t.blank? ? nil : t)
      end.compact.uniq
    end
  end
end

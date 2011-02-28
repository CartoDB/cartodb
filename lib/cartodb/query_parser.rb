module CartoDB
  class QueryParser

    def self.parse_select(query, user)
      parser = SqlParser.new
      unless parsed_query = parser.parse(query)
        raise CartoDB::InvalidQuery
      end
      raise CartoDB::InvalidQuery if parsed_query.operator != :select
      if parsed_query.fields == [:*] && parsed_query.tables.size == 1
        table = Table.filter(:user_id => user.id, :name => parsed_query.tables.first.to_s).first
        columns = Table.schema(user, table, :cartodb_types => true, :skip_the_geom => true)
        query = query.gsub(/(\*)/,columns.map{|c| c.first}.join(','))
        return query, columns
      end
    end

  end
end
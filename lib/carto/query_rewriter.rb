module Carto
  module QueryRewriter
    def rewrite_query(query, old_username, new_user, renamed_tables)
      new_query = query
      new_query = rewrite_query_for_new_user(query, old_username, new_user) if old_username != new_user.username
      new_query = rewrite_query_for_renamed_tables(new_query, renamed_tables) if renamed_tables.present?
      if test_query(new_user, new_query)
        new_query
      else
        CartoDB::Logger.debug(message: 'Did not rewrite query', old_query: query, new_query: new_query,
                              old_username: old_username, user: new_user, renamed_tables: renamed_tables)
        query
      end
    end

    def fix_analysis_node_queries(node, old_username, new_user, renamed_tables)
      options = node.options

      if options && options.has_key?(:table_name)
        old_table_name = options[:table_name]
        options[:table_name] = renamed_tables.fetch(old_table_name, old_table_name)
      end

      params = node.params
      if params && old_username
        query = params[:query]
        params[:query] = rewrite_query(query, old_username, new_user, renamed_tables) if query.present?
      end

      node.children.each { |child| fix_analysis_node_queries(child, old_username, new_user, renamed_tables) }
    end

    private

    def test_query(user, query)
      user.in_database.execute("EXPLAIN (#{query})")
      true
    rescue
      false
    end

    def rewrite_query_for_new_user(query, old_username, new_user)
      if new_user.username == new_user.database_schema
        new_schema = new_user.sql_safe_database_schema
        query.gsub(" #{old_username}.", " #{new_schema}.").gsub(" \"#{old_username}\".", " #{new_schema}.")
      else
        query.gsub(" #{old_username}.", " ").gsub(" \"#{old_username}\".", " ")
      end
    end

    PSQL_WORD_CHARS = '[$_[[:alnum:]]]'.freeze
    def rewrite_query_for_renamed_tables(query, renamed_tables)
      renamed_tables.reduce(query) do |sql, (old_name, new_name)|
        # Replaces the table name only if it matches the whole word
        # i.e: previous and next characters are not PSQL_WORD_CHARS (alphanumerics, _ or $)
        sql.gsub(/(?<!#{PSQL_WORD_CHARS})#{Regexp.escape(old_name)}(?!#{PSQL_WORD_CHARS})/, new_name)
      end
    end
  end
end

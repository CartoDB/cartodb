module Carto
  module QueryRewriter
    def rewrite_query(query, old_username, new_user, renamed_tables)
      new_query = query
      new_query = rewrite_query_for_new_user(query, old_username, new_user) if old_username != new_user.database_schema
      new_query = rewrite_query_for_renamed_tables(new_query, renamed_tables) if renamed_tables.present?

      test_query(new_user, new_query) ? new_query : query
    end

    def qualify_query(query, table_name, username)
      query.gsub(/(?<!\.)("?#{table_name}"?)/, username + '.\\1')
    end

    private

    def test_query(user, query)
      user.in_database.execute("EXPLAIN (#{query})")
      true
    rescue StandardError
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

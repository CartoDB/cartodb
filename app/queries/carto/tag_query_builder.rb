# encoding: UTF-8

require 'active_record'

class Carto::TagQueryBuilder

  def initialize(user_id)
    @user_id = user_id
  end

  def build_paged(page, per_page)
    limit = per_page.to_i
    offset = (page.to_i - 1) * per_page.to_i
    query = ActiveRecord::Base.send(:sanitize_sql_array, [select_sql, @user_id, limit, offset])

    connection = ActiveRecord::Base.connection
    result = connection.exec_query(query)

    format_response(result)
  end

  def total_count
    query = ActiveRecord::Base.send(:sanitize_sql_array, [count_sql, @user_id])

    connection = ActiveRecord::Base.connection
    result = connection.exec_query(query)

    result.cast_values.first
  end

  private

  def select_sql
    %{
      SELECT LOWER(unnest(tags)) AS tag,
        count(*) FILTER(WHERE type = 'derived') AS derived_count,
        count(*) FILTER(WHERE type = 'table') AS table_count
      FROM visualizations
      WHERE user_id = ?
      AND type IN ('table', 'derived')
      GROUP BY tag
      ORDER BY COUNT(*) DESC
      LIMIT ?
      OFFSET ?
    }.squish
  end

  def count_sql
    %{
      SELECT COUNT(DISTINCT(tag))
      FROM (
        SELECT LOWER(unnest(tags)) AS tag
        FROM visualizations
        WHERE user_id = ?
        AND type IN ('table', 'derived')
      ) AS tags
    }.squish
  end

  def format_response(result)
    result.map do |row|
      {
        tag: row['tag'],
        maps: row['derived_count'].to_i,
        datasets: row['table_count'].to_i
      }
    end
  end

end

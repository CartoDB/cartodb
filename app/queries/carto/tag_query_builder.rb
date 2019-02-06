# encoding: UTF-8

require 'active_record'

class Carto::TagQueryBuilder

  def initialize(user_id)
    @user_id = user_id
  end

  def build_paged(page, per_page)
    limit = per_page.to_i
    offset = (page.to_i - 1) * per_page.to_i
    select_query = ActiveRecord::Base.send(:sanitize_sql_array, [select_sql, @user_id, limit, offset])
    count_query = ActiveRecord::Base.send(:sanitize_sql_array, [count_sql, @user_id])

    connection = ActiveRecord::Base.connection
    select_result = connection.exec_query(select_query)
    count_result = connection.exec_query(count_query)

    format_response(select_result, count_result)
  end

  private

  def select_sql
    %{
      SELECT LOWER(unnest(tags)) AS tag,
        count(*) FILTER(WHERE type = 'derived') AS derived_count,
        count(*) FILTER(WHERE type = 'table') AS table_count
      FROM visualizations
      WHERE user_id = ?
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
      ) AS tags
    }.squish
  end

  def format_response(select_result, count_result)
    count = count_result.cast_values.first
    tags = select_result.map do |row|
      {
        tag: row['tag'],
        maps: row['derived_count'].to_i,
        datasets: row['table_count'].to_i
      }
    end
    { tags: tags, total: count }
  end

end

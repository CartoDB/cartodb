# encoding: UTF-8

require 'active_record'

class Carto::TagQueryBuilder

  DEFAULT_TYPES = %w(table derived remote).freeze
  TYPE_TRANSLATIONS = {
    "table" => :datasets,
    "derived" => :maps,
    "remote" => :data_library
  }.freeze

  def initialize(user_id)
    @user_id = user_id
    @types = DEFAULT_TYPES
  end

  def with_types(types)
    @types = types if types.present?
    self
  end

  def with_search_pattern(pattern)
    @pattern = pattern.downcase.tr(' ', '|') if pattern.present?
    self
  end

  def build_paged(page, per_page)
    limit = per_page.to_i
    offset = (page.to_i - 1) * per_page.to_i
    query = ActiveRecord::Base.send(:sanitize_sql_array, [select_sql, @user_id, @types, limit, offset])

    connection = ActiveRecord::Base.connection
    result = connection.exec_query(query)

    format_response(result)
  end

  def total_count
    query = ActiveRecord::Base.send(:sanitize_sql_array, [count_sql, @user_id, @types])

    connection = ActiveRecord::Base.connection
    result = connection.exec_query(query)

    result.cast_values.first
  end

  private

  def select_sql
    %{
      SELECT *
      FROM (
        SELECT LOWER(unnest(tags)) AS tag, #{count_by_type_sql}
        FROM visualizations
        WHERE user_id = ?
        AND type IN (?)
        GROUP BY tag
        ORDER BY COUNT(*) DESC
        LIMIT ?
        OFFSET ?
      ) AS tags
      #{search_filter}
    }.squish
  end

  def count_by_type_sql
    queries = @types.map do |type|
      count_query = "count(*) FILTER(WHERE type = ?) AS #{type}_count"
      ActiveRecord::Base.send(:sanitize_sql_array, [count_query, type])
    end
    queries.join(",")
  end

  def search_filter
    "WHERE tag SIMILAR TO '%(#{@pattern})%'" if @pattern
  end

  def count_sql
    %{
      SELECT COUNT(DISTINCT(tag))
      FROM (
        SELECT LOWER(unnest(tags)) AS tag
        FROM visualizations
        WHERE user_id = ?
        AND type IN (?)
      ) AS tags
      #{search_filter}
    }.squish
  end

  def format_response(result)
    result.map do |row|
      types_count = @types.map { |type|
        { TYPE_TRANSLATIONS.fetch(type, type) => row["#{type}_count"].to_i }
      }.inject(:merge)
      { tag: row['tag'] }.merge(types_count)
    end
  end

end

require 'active_record'

class Carto::TagQueryBuilder

  PATTERN_ESCAPE_CHARS = ['_', '%'].freeze

  DEFAULT_TYPES = %w(table derived remote).freeze
  TYPE_TRANSLATIONS = {
    "table" => :datasets,
    "derived" => :maps,
    "remote" => :data_library
  }.freeze

  def initialize
    @types = DEFAULT_TYPES
  end

  def with_owned_by_user_id(user_id)
    @owner_id = user_id
    @user_id = nil
    self
  end

  def with_owned_by_or_shared_with_user_id(user_id)
    @user_id = user_id
    @owner_id = nil
    self
  end

  def with_types(types)
    @types = types if types.present?
    self
  end

  def with_partial_match(pattern)
    return self unless pattern.present?
    clean_pattern = escape_characters_from_pattern(pattern)
    @pattern = clean_pattern.split(' ').map { |word| "%#{word}%" }
    self
  end

  def build
    build_base_visualization_query
      .select(select_sql)
      .where('array_length(tags, 1) > 0')
      .group('tag')
      .order('total DESC')
  end

  def build_paged(page, per_page)
    offset = (page.to_i - 1) * per_page.to_i
    limit = per_page.to_i
    query = filter_query(query: build, offset: offset, limit: limit)
    result = run_query(query)
    format_response(result)
  end

  def total_count
    query = filter_query(query: build, count: true)
    result = run_query(query)
    result.first["count"].to_i
  end

  private

  def build_base_visualization_query
    query = Carto::VisualizationQueryBuilder.new
    query.with_user_id(@owner_id) if @owner_id
    query.with_owned_by_or_shared_with_user_id(@user_id) if @user_id
    query.with_types(@types) if @types
    query.build
  end

  def select_sql
    "lower(unnest(tags)) AS tag, #{counts_sql}, count(*) as total"
  end

  def counts_sql
    @types.map { |type|
      "sum(CASE type WHEN '#{type}' THEN 1 ELSE 0 END) AS #{type}_count"
    }.join(', ')
  end

  def filter_query(query:, count: false, limit: nil, offset: nil)
    select_clause = count ? "COUNT(tag)" : "*"
    where_clause = "WHERE tag ILIKE ANY (array[?])" if @pattern
    limit_clause = "LIMIT ?" if limit
    offset_clause = "OFFSET ?" if offset
    filter_sql =  %{
      SELECT #{select_clause} FROM (#{query.to_sql}) AS tags #{where_clause} #{limit_clause} #{offset_clause}
    }.squish

    ActiveRecord::Base.send(:sanitize_sql_array, [filter_sql, @pattern, limit, offset].compact)
  end

  def run_query(query)
    connection = ActiveRecord::Base.connection
    connection.exec_query(query)
  end

  def format_response(result)
    result.map do |row|
      types_count = @types.map { |type|
        { TYPE_TRANSLATIONS.fetch(type, type) => row["#{type}_count"].to_i }
      }.inject(:merge)
      { tag: row['tag'] }.merge(types_count)
    end
  end

  def escape_characters_from_pattern(pattern)
    pattern.chars.map { |c| PATTERN_ESCAPE_CHARS.include?(c) ? "\\" + c : c }.join
  end

end

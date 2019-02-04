# encoding: UTF-8

require 'active_record'

class Carto::TagQueryBuilder

  def with_user(user)
    @user_id = user.id
    self
  end

  def build
    query = build_base_visualization_query

    query.select(select_query)
         .where('array_length(tags, 1) > 0')
         .group('tag')
         .order('total DESC')
  end

  def build_paged(page, per_page)
    build.offset((page.to_i - 1) * per_page.to_i).limit(per_page.to_i)
  end

  private

  def build_base_visualization_query
    query = Carto::VisualizationQueryBuilder.new
    query.with_user_id(@user_id) if @user_id
    query.build
  end

  def select_query
    "LOWER(unnest(tags)) AS tag, #{count_select('derived')}, #{count_select('table')}, COUNT(*) as total"
  end

  def count_select(type)
    "SUM(CASE type WHEN '#{type}' THEN 1 ELSE 0 END) AS #{type}_count"
  end

end

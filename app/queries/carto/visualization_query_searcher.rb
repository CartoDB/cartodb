# encoding: UTF-8

require 'active_record'

class Carto::VisualizationQuerySearcher

  PATTERN_ESCAPE_CHARS = ['_', '%'].freeze

  def initialize(query)
    @query = query
  end

  def search(tainted_search_pattern)
    search_pattern = escape_characters_from_pattern(tainted_search_pattern)
    @query.select("#{select_rank_sql(search_pattern)} AS search_rank")
          .where(partial_match_sql, search_pattern, "%#{search_pattern}%")
          .order('search_rank DESC, visualizations.updated_at DESC')
  end

  private

  def escape_characters_from_pattern(pattern)
    pattern.chars.map { |c| PATTERN_ESCAPE_CHARS.include?(c) ? "\\" + c : c }.join
  end

  def tsvector
    %{
      setweight(to_tsvector('english', coalesce("visualizations"."name",'')), 'A') ||
      setweight(to_tsvector('english', coalesce("visualizations"."description",'')), 'B')
    }
  end

  def select_rank_sql(search_pattern)
    %{
      ts_rank(
        #{tsvector},
        plainto_tsquery('english', #{ActiveRecord::Base.sanitize(search_pattern)})
      )
    }.squish
  end

  def partial_match_sql
    %{
      #{tsvector} @@ plainto_tsquery('english', ?)
      OR CONCAT("visualizations"."name", ' ', "visualizations"."description") ILIKE ?
    }.squish
  end

end

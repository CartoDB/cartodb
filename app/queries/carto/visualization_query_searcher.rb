require 'active_record'

class Carto::VisualizationQuerySearcher

  PATTERN_ESCAPE_CHARS = ['_', '%'].freeze

  def initialize(query)
    @query = query
  end

  def search(tainted_search_pattern)
    search_pattern = escape_characters_from_pattern(tainted_search_pattern)
    @query.where(partial_match_sql, search_pattern, "%#{search_pattern}%")
          .order("#{rank_sql(search_pattern)} DESC, visualizations.updated_at DESC")
  end

  private

  def escape_characters_from_pattern(pattern)
    pattern.chars.map { |c| PATTERN_ESCAPE_CHARS.include?(c) ? "\\" + c : c }.join
  end

  def tsvector
    %{
      setweight(to_tsvector('english', coalesce("visualizations"."name",'')), 'A') ||
      setweight(to_tsvector('english', coalesce(array_to_string(visualizations.tags, ''),'')), 'B') ||
      setweight(to_tsvector('english', coalesce("visualizations"."description",'')), 'C')
    }
  end

  def rank_sql(search_pattern)
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
      OR CONCAT("visualizations"."name", array_to_string(visualizations.tags, ''), "visualizations"."description")
      ILIKE ?
    }.squish
  end

end

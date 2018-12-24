# encoding: UTF-8

require 'active_record'
require 'postgres_ext'

class Carto::VisualizationQueryIncluder

  def initialize(query)
    @query = query
  end

  def include_dependent_visualization_count(params = {})
    @query.with(dependencies: dependencies_query(params))
          .joins('LEFT OUTER JOIN dependencies ON dependencies.id = visualizations.id')
  end

  def include_favorited(user_id)
    @query.joins(
      %{
        LEFT JOIN likes
          ON "likes"."subject" = "visualizations"."id"
          AND "likes"."actor" = #{ActiveRecord::Base::sanitize(user_id)}
      }.squish
    )
  end

  private

  def dependencies_query(params)
    nested_association = { map: { user_table: { layers: { maps: :visualization } } } }
    select_count = 'count(distinct(visualizations.id, visualizations_maps.id)) as dependent_visualization_count'
    query = Carto::Visualization.select(:id, select_count)
                                .joins(nested_association)
                                .where(visualizations_maps: { type: 'derived' })
                                .group(:id)
    Carto::VisualizationQueryFilterer.new(query).filter(params)
  end

end

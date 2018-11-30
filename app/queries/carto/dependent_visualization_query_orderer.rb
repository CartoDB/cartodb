# encoding: UTF-8

require 'active_record'
require 'postgres_ext'

class Carto::DependentVisualizationQueryOrderer

  def initialize(query:)
    @query = query
  end

  def order(params: {})
    @query.with(dependencies: dependencies_query(params))
          .select('coalesce(dependent_visualizations_count, 0)')
          .joins('LEFT OUTER JOIN dependencies ON dependencies.id = visualizations.id')
    # TODO: sort
  end

  private

  def dependencies_query(params)
    nested_association = { map: { user_table: { layers: { maps: :visualization } } } }
    select_count = 'count(distinct(visualizations.id, visualizations_maps.id)) as dependent_visualizations_count'
    Carto::Visualization.select(:id, select_count)
                        .joins(nested_association)
                        .where(visualizations_maps: { type: 'derived' })
                        .group(:id)
    # TODO: add filters
  end

end

# encoding: UTF-8

require 'active_record'
require 'postgres_ext'

class Carto::VisualizationQueryFilterer

  def initialize(query: Carto::Visualization.all)
    @query = query
  end

  def sort
    @query = query.with(dependencies: dependencies_query)
    @query = query.select('coalesce(dependent_visualizations_count, 0)')
    @query = query.joins('LEFT OUTER JOIN dependencies ON dependencies.id = visualizations.id')
    # TODO: add filters
    # TODO: sort
  end

  private

  def dependencies_query
    nested_association = { map: { user_table: { layers: { maps: :visualization } } } }
    select_count = 'count(distinct(visualizations.id, visualizations_maps.id)) as dependent_visualizations_count'
    Carto::Visualization.select(:id, select_count)
                        .joins(nested_association)
                        .where(visualizations_maps: { type: 'derived' })
                        .group(:id)
  end

end

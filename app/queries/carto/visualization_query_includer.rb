require 'active_record'

class Carto::VisualizationQueryIncluder

  def initialize(query)
    @query = query
  end

  def include_dependent_visualization_count(params = {})
    join_sql = "LEFT OUTER JOIN (#{dependencies_query(params)}) AS dependencies ON dependencies.id = visualizations.id"
    @query.joins(join_sql)
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
    select_count = 'count(distinct(visualizations.id, dependency_visualizations.id)) as dependent_visualization_count'
    query = Carto::Visualization.select(:id, select_count)
                                .joins(dependency_joins)
                                .where(dependency_visualizations: { type: 'derived' })
                                .group(:id)
    filtered_query = Carto::VisualizationQueryFilterer.new(query).filter(params)
    filtered_query.to_sql
  end

  def dependency_joins
    %{
      INNER JOIN "maps" "dependency_maps" ON "dependency_maps"."id" = "visualizations"."map_id"
      INNER JOIN "user_tables" "dependency_user_tables" ON "dependency_user_tables"."map_id" = "dependency_maps"."id"
      INNER JOIN "layers_user_tables" "dependency_layers_user_tables"
        ON "dependency_layers_user_tables"."user_table_id" = "dependency_user_tables"."id"
      INNER JOIN "layers" "dependency_layers"
        ON "dependency_layers"."id" = "dependency_layers_user_tables"."layer_id"
      INNER JOIN "layers_maps" "dependency_layers_maps"
        ON "dependency_layers_maps"."layer_id" = "dependency_layers"."id"
      INNER JOIN "maps" "dependency_maps_2" ON "dependency_maps_2"."id" = "dependency_layers_maps"."map_id"
      INNER JOIN "visualizations" "dependency_visualizations"
        ON "dependency_visualizations"."map_id" = "dependency_maps_2"."id"
    }.squish
  end

end

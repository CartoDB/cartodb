require 'active_record'

class Carto::VisualizationQueryFilterer

  REGULAR_FILTERS = %i(id name user_id privacy type version locked).freeze

  class InvalidQuery < StandardError; end

  def initialize(query)
    @query = query
  end

  def filter(params = {})
    query = @query

    if params[:name] &&
       !(params[:id] || params[:user_id] || params[:organization_id] || params[:owned_by_or_shared_with_user_id] ||
         params[:shared_with_user_id])
      raise InvalidQuery, 'User or organization is required'
    end

    query = query.where(params.slice(*REGULAR_FILTERS).compact)

    if params[:excluded_ids]
      query = query.where('visualizations.id not in (?)', params[:excluded_ids])
    end

    if params[:user_id_not]
      query = query.where('visualizations.user_id != ?', params[:user_id_not])
    end

    if params[:liked_by_user_id]
      query = query
              .joins(:likes)
              .where(likes: { actor: params[:liked_by_user_id] })
    end

    if params[:shared_with_user_id]
      # The problem here is to manage to generate a query that Postgres will correctly optimize. The problem is that the
      # optimizer seems to have problem determining the best plan when there are many JOINS, such as when VQB is called
      # with many prefetch options, e.g: from visualizations index.
      # This is hacky but works, without a performance hit. Other approaches:
      # - Use a WHERE visualization.id IN (SELECT entity_id...).
      #     psql does a very bad query plan on this, but only when adding the `LEFT OUTER JOIN synchronizations`
      # - Use a CTE (WITH shared_vizs AS (SELECT entity_id ...) SELECT FROM visualizations JOIN shared_vizs)
      #     This generates a nice query plan, but I was unable to generate this with ActiveRecord
      # - Create a view for shared_entities grouped by entity_id, and then create a fake model to join to the
      #     view instead of the table. Should work, but adds a view just to cover for a failure in Rails
      # - Use `GROUP BY visualizations.id, synchronizations.id ...`
      #     For some reason, Rails generates a wrong result when combining `group` with `count`
      # - Use a JOIN `query.joins("JOIN (#{shared_vizs.to_sql} ...)")`
      #     Rails insists in putting custom SQL joins at the end, and psql fails at optimizing. This would work
      #     if this JOIN was written as the first JOIN in the query. psql uses order to inform the optimizer.
      #     This is precisely what this hacks achieves, by tricking the `FROM` part of the query
      # Context: https://github.com/CartoDB/cartodb/issues/13970
      user = Carto::User.where(id: params[:shared_with_user_id]).first
      shared_vizs = Carto::SharedEntity.where(recipient_id: recipient_ids(user)).select(:entity_id).uniq
      query = query.from([Arel::Nodes::SqlLiteral.new("
        visualizations
        JOIN
          (#{shared_vizs.to_sql}) shared_ent
        ON
          visualizations.id = shared_ent.entity_id")])
    end

    if params[:owned_by_or_shared_with_user_id]
      # TODO: sql strings are suboptimal and compromise compositability, but
      # I haven't found a better way to do this OR in Rails
      shared_with_viz_ids = ::Carto::VisualizationQueryBuilder.new.with_shared_with_user_id(
        params[:owned_by_or_shared_with_user_id]).build.uniq.pluck('visualizations.id')
      query = if shared_with_viz_ids.empty?
                query.where(' "visualizations"."user_id" = (?)', params[:owned_by_or_shared_with_user_id])
              else
                query = query.where(' ("visualizations"."user_id" = (?) or "visualizations"."id" in (?))',
                                    params[:owned_by_or_shared_with_user_id], shared_with_viz_ids)
              end
    end

    if params[:exclude_synced_external_sources]
      query = query.joins(%{
                            LEFT JOIN external_sources es
                              ON es.visualization_id = visualizations.id
                          })
                   .joins(%{
                            LEFT JOIN external_data_imports edi
                              ON edi.external_source_id = es.id
                              AND (SELECT state FROM data_imports WHERE id = edi.data_import_id) <> 'failure'
                              #{exclude_only_synchronized(params[:exclude_imported_remote_visualizations])}
                          })
                   .where("edi.id IS NULL")
    end

    if params[:exclude_imported_remote_visualizations]
      # Right now only common-data public visualizations have display name setted so
      # the data-library visualizations have it too. So if we want to filter legacy remote
      # visualizations without display_name, we have to to this way.
      # We take into account other types and exclude from the display_name because the search
      # of datasets, for example, make a query with multiples types (table, remote) and we don't
      # want to filter the table ones
      query = query.where(
        %{
          "visualizations"."type" <> 'remote' OR
            ("visualizations"."type" = 'remote' AND "visualizations"."display_name" IS NOT NULL)
        }.squish
      )
    end

    if params[:excluded_kinds]
      params[:excluded_kinds].each do |kind|
        query = query.where("\"visualizations\".\"kind\" != '#{kind}'")
      end
    end

    if params[:tainted_search_pattern]
      query = Carto::VisualizationQuerySearcher.new(query).search(params[:tainted_search_pattern])
    end

    if params[:tags]
      params[:tags].each(&:downcase!)
      query = query.where(
        "array_to_string(visualizations.tags, ', ') ILIKE '%' || array_to_string(ARRAY[?]::text[], ', ') || '%'",
        params[:tags]
      )
    end

    if params[:bounding_box]
      bbox_sql = Carto::BoundingBoxUtils.to_polygon(
        params[:bounding_box][:minx], params[:bounding_box][:miny],
        params[:bounding_box][:maxx], params[:bounding_box][:maxy]
      )
      query = query.where("visualizations.bbox IS NOT NULL AND visualizations.bbox && #{bbox_sql}")
    end

    if params[:only_with_display_name]
      query = query.where("display_name IS NOT NULL")
    end

    if params[:organization_id]
      query = query.joins(:user).where(users: { organization_id: params[:organization_id] })
    end

    if params[:only_published]
      # "Published" is only required for builder maps
      # This SQL check should match Ruby `Carto::Visualization#published?` definition
      query = query.where(
        %{
          visualizations.privacy <> '#{Carto::Visualization::PRIVACY_PRIVATE}'
            AND ((visualizations.version <> #{Carto::Visualization::VERSION_BUILDER} OR visualizations.version IS NULL)
              OR visualizations.type <> '#{Carto::Visualization::TYPE_DERIVED}'
              OR EXISTS (SELECT 1 FROM mapcaps mc_pub WHERE visualizations.id = mc_pub.visualization_id LIMIT 1)
            )
        }.squish
      )
    end

    # NOTE: The information about DO v2 subscriptions is stored in redis, so keep these filters as
    #       the last ones, to use 'select' with the least number of records

    if params[:with_subscription]
      query = query.where(
        id: query.includes(map: { user_table: :data_import })
                 .find_each.lazy.select { |v| v.subscription.present? }
                 .map(&:id).force
      )
    end

    if params[:with_sample]
      query = query.where(
        id: query.includes(map: { user_table: :data_import })
                 .find_each.lazy.select { |v| v.sample.present? }
                 .map(&:id).force
      )
    end

    query
  end

  private

  def exclude_only_synchronized(exclude_imported_remote_visualizations)
    "AND edi.synchronization_id IS NOT NULL" unless exclude_imported_remote_visualizations
  end

  def recipient_ids(user)
    [user.id, user.organization_id].compact + groups_ids(user)
  end

  def groups_ids(user)
    user.groups.nil? ? [] : user.groups.map(&:id)
  end

end

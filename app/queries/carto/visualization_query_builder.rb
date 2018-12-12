# encoding: UTF-8

require 'active_record'

require_relative '../../models/carto/shared_entity'
require_dependency 'carto/bounding_box_utils'
require_dependency 'carto/uuidhelper'

# TODO: consider moving some of this to model scopes if convenient
class Carto::VisualizationQueryBuilder
  include Carto::UUIDHelper

  def self.user_public_tables(user)
    user_public(user).with_type(Carto::Visualization::TYPE_CANONICAL)
  end

  def self.user_public_visualizations(user)
    user_public(user).with_type(Carto::Visualization::TYPE_DERIVED).with_published
  end

  def self.user_all_visualizations(user)
    new.with_user_id(user ? user.id : nil).with_type(Carto::Visualization::TYPE_DERIVED)
  end

  def self.user_public(user)
    new.with_user_id(user ? user.id : nil).with_privacy(Carto::Visualization::PRIVACY_PUBLIC)
  end

  PARTIAL_MATCH_QUERY = %Q{
    to_tsvector(
      'english', coalesce("visualizations"."name", '') || ' '
      || coalesce("visualizations"."description", '')
    ) @@ plainto_tsquery('english', ?)
    OR CONCAT("visualizations"."name", ' ', "visualizations"."description") ILIKE ?
  }

  PATTERN_ESCAPE_CHARS = ['_', '%'].freeze

  def initialize
    @include_associations = []
    @eager_load_associations = []
    @exclude_synced_external_sources = false
    @exclude_imported_remote_visualizations = false
    @excluded_kinds = []
  end

  def with_id_or_name(id_or_name)
    raise 'VisualizationQueryBuilder: id or name supplied is nil' if id_or_name.nil?

    if is_uuid?(id_or_name)
      with_id(id_or_name)
    else
      with_name(id_or_name)
    end
  end

  def with_id(id)
    @id = id
    self
  end

  def with_excluded_ids(ids)
    @excluded_ids = ids
    self
  end

  def without_synced_external_sources
    @exclude_synced_external_sources = true
    self
  end

  def without_imported_remote_visualizations
    @exclude_imported_remote_visualizations = true
    self
  end

  def without_raster
    @excluded_kinds << Carto::Visualization::KIND_RASTER
    self
  end

  def with_name(name)
    @name = name
    self
  end

  def with_user_id(user_id)
    @user_id = user_id
    self
  end

  def with_user_id_not(user_id)
    @user_id_not = user_id
    self
  end

  def with_privacy(privacy)
    @privacy = privacy
    self
  end

  def with_liked_by_user_id(user_id)
    @liked_by_user_id = user_id
    self
  end

  def with_shared_with_user_id(user_id)
    @shared_with_user_id = user_id
    self
  end

  def with_owned_by_or_shared_with_user_id(user_id)
    @owned_by_or_shared_with_user_id = user_id
    self
  end

  def with_prefetch_user(force_join = false)
    if force_join
      with_eager_load_of(:user)
    else
      with_include_of(:user)
    end
  end

  def with_prefetch_table
    nested_association = { map: :user_table }
    with_eager_load_of(nested_association)
  end

  def with_prefetch_dependent_visualizations
    inner_visualization = { visualization: { map: { layers: :layers_user_tables } } }
    nested_association = { map: { user_table: { layers: { maps: inner_visualization } } } }
    with_eager_load_of(nested_association)
  end

  def with_prefetch_permission
    nested_association = { permission: :owner }
    with_eager_load_of(nested_association)
  end

  def with_prefetch_external_source
    with_eager_load_of(:external_source)
  end

  def with_prefetch_synchronization
    with_eager_load_of(:synchronization)
    self
  end

  def with_type(type)
    # Clear always the other "types holder"
    @types = nil

    @type = type == nil || type == '' ? nil : type
    self
  end

  def with_types(types)
    # Clear always the other "types holder"
    @type = nil

    @types = types
    self
  end

  def with_locked(locked)
    @locked = locked
    self
  end

  def with_current_user_id(user_id)
    @current_user_id = user_id
  end

  def with_order(order, direction = 'asc')
    @order = order.to_s
    @direction = direction.to_s
    self
  end

  def with_partial_match(tainted_search_pattern)
    @tainted_search_pattern = escape_characters_from_pattern(tainted_search_pattern)
    self
  end

  def escape_characters_from_pattern(pattern)
    pattern.chars.map { |c| (PATTERN_ESCAPE_CHARS.include? c) ? "\\" + c : c }.join
  end

  def with_tags(tags)
    @tags = tags
    self
  end

  def with_bounding_box(bounding_box)
    @bounding_box = bounding_box
    self
  end

  def with_display_name
    @only_with_display_name = true
    self
  end

  def with_organization_id(organization_id)
    @organization_id = organization_id
    self
  end

  # Published: see `Carto::Visualization#published?`
  def with_published
    @only_published = true
    self
  end

  def with_version(version)
    @version = version
    self
  end

  def build
    query = Carto::Visualization.all

    if @name && !(@id || @user_id || @organization_id || @owned_by_or_shared_with_user_id || @shared_with_user_id)
      CartoDB::Logger.error(message: "VQB query by name without user_id nor org_id")
      raise 'VQB query by name without user_id nor org_id'
    end

    if @id
      query = query.where(id: @id)
    end

    if @excluded_ids && !@excluded_ids.empty?
      query = query.where('visualizations.id not in (?)', @excluded_ids)
    end

    if @name
      query = query.where(name: @name)
    end

    if @user_id
      query = query.where(user_id: @user_id)
    end

    if @user_id_not
      query = query.where('visualizations.user_id != ?', @user_id_not)
    end

    if @privacy
      query = query.where(privacy: @privacy)
    end

    if @liked_by_user_id
      query = query
              .joins(:likes)
              .where(likes: { actor: @liked_by_user_id })
    end

    if @shared_with_user_id
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
      user = Carto::User.where(id: @shared_with_user_id).first
      shared_vizs = Carto::SharedEntity.where(recipient_id: recipient_ids(user)).select(:entity_id).uniq
      query = query.from([Arel::Nodes::SqlLiteral.new("
        visualizations
        JOIN
          (#{shared_vizs.to_sql}) shared_ent
        ON
          visualizations.id = shared_ent.entity_id")])
    end

    if @owned_by_or_shared_with_user_id
      # TODO: sql strings are suboptimal and compromise compositability, but
      # I haven't found a better way to do this OR in Rails
      shared_with_viz_ids = ::Carto::VisualizationQueryBuilder.new.with_shared_with_user_id(
        @owned_by_or_shared_with_user_id).build.uniq.pluck('visualizations.id')
      if shared_with_viz_ids.empty?
        query = query.where(' "visualizations"."user_id" = (?)', @owned_by_or_shared_with_user_id)
      else
        query = query.where(' ("visualizations"."user_id" = (?) or "visualizations"."id" in (?))',
                            @owned_by_or_shared_with_user_id, shared_with_viz_ids)
      end
    end

    if @exclude_synced_external_sources
      query = query.joins(%{
                            LEFT JOIN external_sources es
                              ON es.visualization_id = visualizations.id
                          })
                   .joins(%{
                            LEFT JOIN external_data_imports edi
                              ON edi.external_source_id = es.id
                              AND (SELECT state FROM data_imports WHERE id = edi.data_import_id) <> 'failure'
                              #{exclude_only_synchronized}
                          })
                   .where("edi.id IS NULL")
    end

    if @exclude_imported_remote_visualizations
      # Right now only common-data public visualizations have display name setted so
      # the data-library visualizations have it too. So if we want to filter legacy remote
      # visualizations without display_name, we have to to this way.
      # We take into account other types and exclude from the display_name because the search
      # of datasets, for example, make a query with multiples types (table, remote) and we don't
      # want to filter the table ones
      query = query.where('("visualizations"."type" <> \'remote\' OR "visualizations"."type" = \'remote\' AND "visualizations"."display_name" IS NOT NULL)')
    end

    @excluded_kinds.each do |kind|
      query = query.where("\"visualizations\".\"kind\" != '#{kind}'")
    end

    if @type
      query = query.where(type: @type)
    end

    if @types
      query = query.where(type: @types)
    end

    if !@locked.nil?
      query = query.where(locked: @locked)
    end

    if @tainted_search_pattern
      query = query.where(PARTIAL_MATCH_QUERY, @tainted_search_pattern, "%#{@tainted_search_pattern}%")
    end

    if @tags
      @tags.each(&:downcase!)
      query = query.where("array_to_string(visualizations.tags, ', ') ILIKE '%' || array_to_string(ARRAY[?]::text[], ', ') || '%'", @tags)
    end

    if @bounding_box
      bbox_sql = Carto::BoundingBoxUtils.to_polygon(
        @bounding_box[:minx], @bounding_box[:miny], @bounding_box[:maxx], @bounding_box[:maxy]
      )
      query = query.where("visualizations.bbox is not null AND visualizations.bbox && #{bbox_sql}")
    end

    if @only_with_display_name
      query = query.where("display_name is not null")
    end

    if @organization_id
      query = query.joins(:user).where(users: { organization_id: @organization_id })
    end

    if @version
      query = query.where(version: @version)
    end

    if @only_published
      # "Published" is only required for builder maps
      # This SQL check should match Ruby `Carto::Visualization#published?` definition
      query = query.where(%{
            visualizations.privacy <> '#{Carto::Visualization::PRIVACY_PRIVATE}'
        and (
               ((visualizations.version <> #{Carto::Visualization::VERSION_BUILDER}) or (visualizations.version is null))
            or
               visualizations.type <> '#{Carto::Visualization::TYPE_DERIVED}'
            or
               (exists (select 1 from mapcaps mc_pub where visualizations.id = mc_pub.visualization_id limit 1))
            )
      })
    end

    query = query.includes(@include_associations)
    query = query.eager_load(@eager_load_associations)

    Carto::VisualizationQueryOrderer.new(query: query, user_id: @current_user_id).order(@order, @direction)
  end

  def build_paged(page = 1, per_page = 20)
    build.offset((page.to_i - 1) * per_page.to_i).limit(per_page.to_i)
  end

  private

  def with_include_of(association)
    @include_associations << association
    self
  end

  def with_eager_load_of(association)
    @eager_load_associations << association
    self
  end

  def recipient_ids(user)
    [ user.id, user.organization_id ].compact + groups_ids(user)
  end

  def groups_ids(user)
    user.groups.nil? ? [] : user.groups.collect(&:id)
  end

  def exclude_only_synchronized
    "AND edi.synchronization_id IS NOT NULL" unless @exclude_imported_remote_visualizations
  end

end

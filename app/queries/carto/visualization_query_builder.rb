# encoding: UTF-8

require 'active_record'

require_relative '../../models/carto/shared_entity'
require_relative '../../helpers/bounding_box_helper'
require_dependency 'carto/uuidhelper'

# TODO: consider moving some of this to model scopes if convenient
class Carto::VisualizationQueryBuilder
  include Carto::UUIDHelper

  SUPPORTED_OFFDATABASE_ORDERS = [ 'mapviews', 'likes', 'size' ]

  def self.user_public_tables(user)
    self.user_public(user).with_type(Carto::Visualization::TYPE_CANONICAL)
  end

  def self.user_public_visualizations(user)
    self.user_public(user).with_type(Carto::Visualization::TYPE_DERIVED)
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

  def initialize
    @include_associations = []
    @eager_load_associations = []
    @eager_load_nested_associations = {}
    @order = {}
    @off_database_order = {}
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
    @excluded_kinds << CartoDB::Visualization::Member::KIND_RASTER
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
    with_eager_load_of(:table)
  end

  def with_prefetch_permission
    with_eager_load_of_nested_associations(:permission => :owner)
  end

  def with_prefetch_external_source
    with_eager_load_of(:external_source)
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

  def with_order(order, asc_desc = :asc)
    offdb_order = offdatabase_order(order)
    if offdb_order
      @off_database_order[offdb_order] = asc_desc
    else
      @order[order] = asc_desc
    end
    self
  end

  def with_partial_match(tainted_search_pattern)
    @tainted_search_pattern = tainted_search_pattern
    self
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

  def build
    query = Carto::Visualization.scoped

    unless @id || @user_id || @organization_id
      CartoDB.notify_debug("VQB query without viz_id, user_id nor org_id", stack: caller.take(25))
    end

    if @id
      query = query.where(id: @id)
    end

    if @excluded_ids and !@excluded_ids.empty?
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
      user = Carto::User.where(id: @shared_with_user_id).first
      query = query.joins(:shared_entities)
                   .where(:shared_entities => { recipient_id: recipient_ids(user) })
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
      query = query.joins(%Q{
                            LEFT JOIN external_sources es
                              ON es.visualization_id = visualizations.id
                          })
                   .joins(%Q{
                            LEFT JOIN external_data_imports edi
                              ON  edi.external_source_id = es.id
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
      @tags.each do |t|
        t.downcase!
      end
      query = query.where("array_to_string(visualizations.tags, ', ') ILIKE '%' || array_to_string(ARRAY[?]::text[], ', ') || '%'", @tags)
    end

    if @bounding_box
      bbox_sql = BoundingBoxHelper.to_polygon(@bounding_box[:minx], @bounding_box[:miny], @bounding_box[:maxx], @bounding_box[:maxy])
      query = query.where("visualizations.bbox is not null AND visualizations.bbox && #{bbox_sql}")
    end

    if @only_with_display_name
      query = query.where("display_name is not null")
    end

    if @organization_id
      query = query.joins(user: :organization).where(organizations: { id: @organization_id })
    end

    @include_associations.each { |association|
      query = query.includes(association)
    }

    @eager_load_associations.each { |association|
      query = query.eager_load(association)
    }

    query = query.eager_load(@eager_load_nested_associations) if @eager_load_nested_associations != {}

    @order.each { |k, v|
      query = query.order(k)
      query = query.reverse_order if v == :desc
    }

    if @off_database_order.empty?
      query
    else
      Carto::OffdatabaseQueryAdapter.new(query, @off_database_order)
    end
  end

  def build_paged(page = 1, per_page = 20)
    self.build.offset((page - 1) * per_page).limit(per_page)
  end

  private

  def offdatabase_order(order)
    return nil unless order.kind_of? String
    fragments = order.split('.')
    order_attribute = fragments[fragments.count - 1]
    SUPPORTED_OFFDATABASE_ORDERS.include?(order_attribute) ? order_attribute : nil
  end

  def with_include_of(association)
    @include_associations << association
    self
  end

  def with_eager_load_of(association)
    @eager_load_associations << association
    self
  end

  def with_eager_load_of_nested_associations(associations_hash)
    @eager_load_nested_associations.merge!(associations_hash)
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

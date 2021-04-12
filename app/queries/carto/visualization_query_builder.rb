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
    user_public_privacy_visualizations(user).with_published
  end

  def self.user_public_privacy_visualizations(user)
    user_public(user).with_types(Carto::Visualization::MAP_TYPES)
  end

  def self.user_public_privacy_datasets(user)
    user_public(user).with_types(Carto::Visualization::TYPE_CANONICAL)
  end

  def self.user_link_privacy_visualizations(user)
    new.with_user_id(user.id)
       .with_types(Carto::Visualization::MAP_TYPES)
       .with_privacy(Carto::Visualization::PRIVACY_LINK)
  end

  def self.user_password_privacy_visualizations(user)
    new.with_user_id(user.id)
       .with_types(Carto::Visualization::MAP_TYPES)
       .with_privacy(Carto::Visualization::PRIVACY_PROTECTED)
  end

  def self.user_private_privacy_visualizations(user)
    new.with_user_id(user.id)
       .with_types(Carto::Visualization::MAP_TYPES)
       .with_privacy(Carto::Visualization::PRIVACY_PRIVATE)
  end

  def self.user_all_visualizations(user)
    new.with_user_id(user ? user.id : nil).with_types(Carto::Visualization::MAP_TYPES)
  end

  def self.user_public(user)
    new.with_user_id(user ? user.id : nil).with_privacy(Carto::Visualization::PRIVACY_PUBLIC)
  end

  def initialize
    @include_associations = []
    @eager_load_associations = []
    @filtering_params = {}
  end

  def with_id_or_name(id_or_name)
    raise 'VisualizationQueryBuilder: id or name supplied is nil' if id_or_name.nil?

    if uuid?(id_or_name)
      with_id(id_or_name)
    else
      with_name(id_or_name)
    end
  end

  def with_id(id)
    @filtering_params[:id] = id
    self
  end

  def with_excluded_ids(ids)
    @filtering_params[:excluded_ids] = ids
    self
  end

  def without_synced_external_sources
    @filtering_params[:exclude_synced_external_sources] = true
    self
  end

  def without_imported_remote_visualizations
    @filtering_params[:exclude_imported_remote_visualizations] = true
    self
  end

  def without_raster
    @filtering_params[:excluded_kinds] ||= []
    @filtering_params[:excluded_kinds] << Carto::Visualization::KIND_RASTER
    self
  end

  def with_name(name)
    @filtering_params[:name] = name
    self
  end

  def with_user_id(user_id)
    @filtering_params[:user_id] = user_id
    self
  end

  def with_user_id_not(user_id)
    @filtering_params[:user_id_not] = user_id
    self
  end

  def with_privacy(privacy)
    @filtering_params[:privacy] = privacy
    self
  end

  def with_liked_by_user_id(user_id)
    @filtering_params[:liked_by_user_id] = user_id
    self
  end

  def with_shared_with_user_id(user_id)
    @filtering_params[:shared_with_user_id] = user_id
    self
  end

  def with_owned_by_or_shared_with_user_id(user_id)
    @filtering_params[:owned_by_or_shared_with_user_id] = user_id
    self
  end

  def with_subscription
    @filtering_params[:with_subscription] = true
    self
  end

  def with_sample
    @filtering_params[:with_sample] = true
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
    inner_visualization = { visualization: { map: { layers: :layers_user_tables }, permission: :owner } }
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
    @filtering_params[:type] = type
    self
  end

  alias with_types with_type

  def with_locked(locked)
    @filtering_params[:locked] = locked
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
    @filtering_params[:tainted_search_pattern] = tainted_search_pattern
    self
  end

  def with_tags(tags)
    @filtering_params[:tags] = tags
    self
  end

  def with_bounding_box(bounding_box)
    @filtering_params[:bounding_box] = bounding_box
    self
  end

  def with_display_name
    @filtering_params[:only_with_display_name] = true
    self
  end

  def with_organization_id(organization_id)
    @filtering_params[:organization_id] = organization_id
    self
  end

  # Published: see `Carto::Visualization#published?`
  def with_published
    @filtering_params[:only_published] = true
    self
  end

  def with_version(version)
    @filtering_params[:version] = version
    self
  end

  def build
    offdatabase_order? ? build_regular : build_subquery
  end

  def count
    filtered_query.count
  end

  def build_paged(page = 1, per_page = 20)
    offdatabase_order? ? build_regular(page, per_page) : build_subquery(page, per_page)
  end

  def filtered_query
    query = Carto::Visualization.all
    Carto::VisualizationQueryFilterer.new(query).filter(@filtering_params)
  end

  private

  def build_regular(page = nil, per_page = nil)
    query = filtered_query
    query = with_associations(query)
    query = order_query(query)
    query = query.offset((page.to_i - 1) * per_page.to_i).limit(per_page.to_i) if page && per_page
    query
  end

  def build_subquery(page = nil, per_page = nil)
    subquery = with_ordering_associations(filtered_query)
    subquery = order_query(subquery)
    subquery = subquery.offset((page.to_i - 1) * per_page.to_i).limit(per_page.to_i) if page && per_page

    # Fetching related tables after filtering the results for better performance
    query = Carto::Visualization.from(subquery, 'visualizations')
    with_associations(query)
  end

  def order_query(query)
    # Search has its own ordering criteria
    return query if @tainted_search_pattern

    orderer = Carto::VisualizationQueryOrderer.new(query)
    orderer.order(@order, @direction)
  end

  def with_include_of(association)
    @include_associations << association
    self
  end

  def with_eager_load_of(association)
    @eager_load_associations << association
    self
  end

  def with_associations(query)
    query = query.includes(@include_associations) unless @include_associations.empty?
    query = query.eager_load(@eager_load_associations) unless @eager_load_associations.empty?
    query
  end

  def with_ordering_associations(query)
    query = with_favorited(query) unless @filtering_params[:liked_by_user_id]
    query = with_dependent_visualization_count(query)
    query
  end

  def with_favorited(query)
    # We have to include favorites if we're not filtering by them
    # Why? Both of them include a join with the likes table: favorited uses
    # a left-join one and the filter will use an inner-join.
    # So what is the problem? It'll fail because is not possible to include two
    # joins for the same table
    # And what is the difference?
    #  - Filtering leaves only the favorited/liked visualizations by the user
    #  - With favorited we add the like/favorite data to the visualization information
    return query unless @order&.include?('favorited') && @current_user_id

    Carto::VisualizationQueryIncluder.new(query).include_favorited(@current_user_id)
  end

  def with_dependent_visualization_count(query)
    return query unless @order&.include?('dependent_visualizations')

    with_prefetch_dependent_visualizations
    Carto::VisualizationQueryIncluder.new(query).include_dependent_visualization_count(@filtering_params)
  end

  def offdatabase_order?
    Carto::VisualizationQueryOrderer::SUPPORTED_OFFDATABASE_ORDERS.any? do |offdatabase_order|
      @order&.include?(offdatabase_order)
    end
  end

end

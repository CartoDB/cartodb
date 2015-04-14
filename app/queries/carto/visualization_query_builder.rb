require 'active_record'

require_relative '../../models/carto/shared_entity'

# TODO: consider moving some of this to model scopes if convenient
class Carto::VisualizationQueryBuilder

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
  end

  def with_user_id(user_id)
    @user_id = user_id
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
    @type = type == nil || type == '' ? nil : type
    self
  end

  def with_types(types)
    @types = types
    self
  end

  def with_locked(locked)
    @locked = locked
    self
  end

  def with_order(order, asc_desc = :asc)
    @order[order] = asc_desc
    self
  end

  def with_partial_match(tainted_search_pattern)
    @tainted_search_pattern = tainted_search_pattern
    self
  end

  def build
    query = Carto::Visualization.scoped

    if !@user_id.nil?
      query = query.where(user_id: @user_id)
    end

    if !@privacy.nil?
      query = query.where(privacy: @privacy)
    end

    if !@liked_by_user_id.nil?
      query = query
          .joins(:likes)
          .where(likes: { actor: @liked_by_user_id })
    end

    if !@shared_with_user_id.nil?
      user = Carto::User.where(id: @shared_with_user_id).first
      query = query
          .joins(:shared_entities)
          .where(:shared_entities => { recipient_id: recipient_ids(user) })
    end

    if !@owned_by_or_shared_with_user_id.nil?
      # TODO: sql strings are suboptimal and compromise compositability, but
      # I haven't found a better way to do this OR in Rails
      query = query.where(' ("visualizations"."user_id" = (?) or "visualizations"."id" in (?))',  @owned_by_or_shared_with_user_id, ::Carto::VisualizationQueryBuilder.new.with_shared_with_user_id(@owned_by_or_shared_with_user_id).build.uniq.pluck('visualizations.id'))
    end

    if !@type.nil?
      query = query.where(type: @type)
    end

    if !@types.nil?
      query = query.where(type: @types)
    end

    if !@locked.nil?
      query = query.where(locked: @locked)
    end

    if !@tainted_search_pattern.nil?
      query = query.where(PARTIAL_MATCH_QUERY, @tainted_search_pattern, "%#{@tainted_search_pattern}%")
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

    query
  end

  def build_paged(page = 1, per_page = 20)
    self.build.offset((page - 1) * per_page).limit(per_page)
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

  def with_eager_load_of_nested_associations(associations_hash)
    @eager_load_nested_associations.merge!(associations_hash)
    self
  end

  def recipient_ids(user)
    [ user.id, user.organization_id ].compact
  end

end

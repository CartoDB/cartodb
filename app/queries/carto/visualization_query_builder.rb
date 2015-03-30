require 'active_record'

require_relative '../../models/carto/shared_entity'

class Carto::VisualizationQueryBuilder

  def initialize
    @eager_load_associations = []
    @eager_load_nested_associations = {}
  end

  def with_user_id(user_id)
    @user_id = user_id
    self
  end

  def with_liked_by_user_id(user_id)
    @liked_by_user_id = user_id
    self
  end

  def with_visualizations_shared_with(user_id)
    @shared_with_user_id = user_id
    self
  end

  def with_prefetch_user
    with_eager_load_of(:user)
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

  def build
    query = Carto::Visualization.scoped

    if !@user_id.nil?
      query = query.where(user_id: @user_id)
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

    if !@type.nil?
      query = query.where(type: @type)
    end

    @eager_load_associations.each { |association|
      query = query.eager_load(association)
    }

    query = query.eager_load(@eager_load_nested_associations) if @eager_load_nested_associations != {}

    query
  end

  def build_paged(page = 1, per_page = 20)
    query = self.build
    query.offset = (page - 1) * per_page
    query.limit = per_page
    query
  end

  private

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

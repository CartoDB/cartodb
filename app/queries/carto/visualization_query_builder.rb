require 'active_record'

require_relative '../../models/carto/shared_entity'

class Carto::VisualizationQueryBuilder

  def initialize
    @prefetch_associations = []
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

  def with_join_prefetch_of(association)
    @prefetch_associations << association
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
          .joins(:shared_entities).where(:shared_entities => { recipient_id: recipient_ids(user) })
    end

    @prefetch_associations.each { |association|
      query = query.joins(association).includes(association)
    }

    query
  end

  private

  # TODO: move this to SharedEntityQueryBuilder?
  #def visualization_shares(user)
  #  Carto::SharedEntity.shared_visualizations.where(:recipient_id => recipient_ids(user))
  #end

  def recipient_ids(user)
    [ user.id, user.organization_id ].compact
  end

end

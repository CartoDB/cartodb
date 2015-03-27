require 'active_record'

require_relative '../../models/carto/shared_entity'

class Carto::VisualizationQueryBuilder

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

  def build
    query = Carto::Visualization.scoped

    if !@user_id.nil?
      query = query.where(user_id: @user_id)
    end

    if !@liked_by_user_id.nil?
      # TODO: this is needed because of column type mismatch
      #.joins(:likes)
      query = query
          .joins('inner join likes on likes.subject::text = visualizations.id')
          .where(likes: { actor: @liked_by_user_id })
    end

    if !@shared_with_user_id.nil?
      user = Carto::User.where(id: @shared_with_user_id).first
      # TODO: we can't join both because of visualization.id column type. Try improvement like Visuaization.likes association.
      query = query.where(id: visualization_shares(user).pluck(:entity_id)).joins(:user).includes(:user)
    end

    query
  end

  private

  # TODO: move this to SharedEntityQueryBuilder?
  def visualization_shares(user)
    Carto::SharedEntity.shared_visualizations.where(:recipient_id => recipient_ids(user))
  end

  def recipient_ids(user)
    [ user.id, user.organization_id ].compact
  end

end

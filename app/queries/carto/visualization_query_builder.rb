require 'active_record'

require_relative '../../models/carto/shared_entity'

class Carto::VisualizationQueryBuilder

  def with_user_id(user_id)
    @user_id = user_id
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

    if !@shared_with_user_id.nil?
      user = Carto::User.where(id: @shared_with_user_id).first
      # INFO: we can't join both because of entity_id column type
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

require 'active_record'

module Carto

  class User < ActiveRecord::Base
    has_many :visualizations, inverse_of: :user
    belongs_to :organization, inverse_of: :users

    def user_shared_visualizations
      Visualization.where(id: visualization_shares.pluck(:entity_id))
    end

    private

    def visualization_shares
      SharedEntity.shared_visualizations.where(:recipient_id => recipient_ids)
    end

    def recipient_ids
      [ self.id, self.organization_id ].compact
    end

  end

end

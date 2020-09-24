module Carto
  class FeatureFlagsUser < ActiveRecord::Base

    belongs_to :feature_flag, foreign_key: :feature_flag_id
    belongs_to :user, foreign_key: :user_id

    validates :user, :feature_flag, presence: true

  end
end

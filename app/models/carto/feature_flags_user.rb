module Carto

  class FeatureFlagsUser < ApplicationRecord
    
    belongs_to :feature_flag, foreign_key: :feature_flag_id
    belongs_to :user, foreign_key: :user_id

  end

end

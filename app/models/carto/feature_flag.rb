module Carto
  class FeatureFlag < ActiveRecord::Base

    validates :name, presence: true

    has_many :feature_flags_user, dependent: :destroy

    def self.find_by_user(user)
      FeatureFlag.where(restricted: false) + user.feature_flags.select(&:restricted)
    end

  end
end

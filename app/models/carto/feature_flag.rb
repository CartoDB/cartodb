module Carto
  class FeatureFlag < ActiveRecord::Base

    has_many :feature_flags_user, dependent: :destroy
    has_many :users, through: :feature_flags_user

    scope :restricted, -> { where(restricted: true) }
    scope :not_restricted, -> { where(restricted: false) }

    validates :name, presence: true
  end
end

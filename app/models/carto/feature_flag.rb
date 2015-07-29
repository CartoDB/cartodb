# encoding: UTF-8

module Carto

  class FeatureFlag < ActiveRecord::Base
   
    validates :name, presence: true

    has_many :feature_flags_user, :dependent => :destroy
    has_many :users, :through => :feature_flags_user

    def self.find_by_user(user)
      FeatureFlag.where(restricted: false) + user.feature_flags.select { |feature_flag| feature_flag.restricted }
    end

  end

end

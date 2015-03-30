# encoding: UTF-8

module Carto

  class FeatureFlagsUser < ActiveRecord::Base
    
    belongs_to :feature_flag
    belongs_to :user

  end

end

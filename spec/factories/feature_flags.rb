require 'helpers/random_names_helper'

include RandomNamesHelper

FactoryGirl.define do

  factory :feature_flag do
    id { random_integer }
    sequence(:name) { |n| "FF#{n}" }
    restricted true
  end

  factory :carto_feature_flag, class: Carto::FeatureFlag do
    id { random_integer }
    sequence(:name) { |n| "FF#{n}" }
    restricted true
  end

end

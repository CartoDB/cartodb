require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do

  factory :feature_flag do
    id { unique_integer }
    sequence(:name) { |n| "FF#{n}" }
    restricted true
  end

  factory :carto_feature_flag, class: Carto::FeatureFlag do
    id { unique_integer }
    sequence(:name) { |n| "FF#{n}" }
    restricted true
  end

end

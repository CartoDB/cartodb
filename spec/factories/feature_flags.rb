require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do
  factory :feature_flag, class: ::FeatureFlag do
    to_create(&:save)

    id { unique_integer }
    name { unique_name('ff') }
    restricted true
  end

  factory :carto_feature_flag, class: Carto::FeatureFlag do
    id { unique_integer }
    name { unique_name('ff') }
    restricted true
  end

end

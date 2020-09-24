require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do

  factory :feature_flag, class: Carto::FeatureFlag do
    id { unique_integer }
    name { unique_name('ff') }
    restricted true

    trait(:restricted) { restricted true }
    trait(:not_restricted) { restricted false }
  end

end

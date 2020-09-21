require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do
  factory :feature_flags_user, class: Carto::FeatureFlagsUser do
    id { unique_integer }
  end
end

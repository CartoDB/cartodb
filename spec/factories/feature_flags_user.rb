require 'helpers/random_names_helper'

include RandomNamesHelper

FactoryGirl.define do
  factory :feature_flags_user do
    id { random_integer }
  end
end

require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do
  factory :feature_flags_user do
    id { unique_integer }
  end
end

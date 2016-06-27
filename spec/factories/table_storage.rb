require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do
  factory :table, class: Table do
  end
end

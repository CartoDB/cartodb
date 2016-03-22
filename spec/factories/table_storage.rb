require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do

  factory :table, class: Table do
  end

  factory :user_table, class: UserTable do
    name { unique_name('user_table') }
  end

  factory :carto_user_table, class: Carto::UserTable do
    name { unique_name('user_table') }
  end

end

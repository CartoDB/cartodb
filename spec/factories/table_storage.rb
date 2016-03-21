require 'helpers/random_names_helper'

include RandomNamesHelper

FactoryGirl.define do

  factory :table, class: Table do
  end

  factory :user_table, class: UserTable do
    name { random_name('user_table') }
  end

  factory :carto_user_table, class: Carto::UserTable do
    name { random_name('user_table') }
  end

end

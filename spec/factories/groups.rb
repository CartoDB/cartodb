# encoding: utf-8
require 'helpers/random_names_helper'

include RandomNamesHelper

FactoryGirl.define do
  factory :carto_group, class: Carto::Group do
    name 'A_Group'
    display_name 'A Group'
    database_role 'database_role'
  end

  factory :new_random_group, class: Carto::Group do |_g|
    name { random_name('group') }
    display_name { "Group #{name}" }

    factory :random_group do
      database_role { "database_role_#{name}" }
    end
  end
end

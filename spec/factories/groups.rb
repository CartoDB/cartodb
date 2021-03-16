require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryBot.define do
  factory :carto_group, class: Carto::Group do
    initialize_with { Carto::Group.send :new }

    name { 'A_Group' }
    display_name { 'A Group' }
    database_role { 'database_role' }
  end

  factory :new_random_group, class: Carto::Group do |_g|
    initialize_with { Carto::Group.send :new }

    name { unique_name('group') }
    display_name { "Group #{name}" }

    factory :random_group do
      database_role { "database_role_#{name}" }
    end
  end
end

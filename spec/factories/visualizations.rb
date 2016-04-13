require 'uuidtools'

FactoryGirl.define do

  random = UUIDTools::UUID.timestamp_create.to_s

  factory :derived_visualization, class: CartoDB::Visualization::Member do
    type 'derived'
    name "visualization #{random}"
    privacy 'public'
  end

  factory :table_visualization, class: CartoDB::Visualization::Member do
    type 'table'
    name "visualization_#{random}"
    privacy 'public'
  end

  factory :carto_visualization, class: Carto::Visualization do
    id { UUIDTools::UUID.random_create.to_s }
    type 'derived'
    name 'factory visualization'
    privacy 'public'

    association :user, factory: :carto_user
    permission { FactoryGirl.create :carto_permission, owner: user }

  end

end

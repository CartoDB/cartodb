require 'uuidtools'
require_dependency 'carto/uuidhelper'

include Carto::UUIDHelper

FactoryGirl.define do
  factory :derived_visualization, class: CartoDB::Visualization::Member do
    to_create(&:store)
    type 'derived'
    name "visualization #{random_uuid}"
    privacy 'public'
  end

  factory :table_visualization, class: CartoDB::Visualization::Member do
    to_create(&:store)
    type 'table'
    name "visualization_#{random_uuid}"
    privacy 'public'
  end

  factory :carto_visualization, class: Carto::Visualization do
    id { random_uuid }
    type 'derived'
    name 'factory visualization'
    title 'visualization title'
    privacy 'public'

    association :user, factory: :carto_user
    permission { FactoryGirl.create :carto_permission, owner: user }

    factory :carto_private_visualization do
      privacy Carto::Visualization::PRIVACY_PRIVATE
    end

    factory :carto_table_visualization do
      type Carto::Visualization::TYPE_CANONICAL
    end
  end

end

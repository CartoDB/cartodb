require 'uuidtools'
require_dependency 'carto/uuidhelper'

include Carto::UUIDHelper

FactoryGirl.define do

  factory :derived_visualization, class: CartoDB::Visualization::Member do
    type 'derived'
    name "visualization #{random_uuid}"
    privacy 'public'
  end

  factory :table_visualization, class: CartoDB::Visualization::Member do
    type 'table'
    name "visualization_#{random_uuid}"
    privacy 'public'
  end

  factory :carto_visualization, class: Carto::Visualization do
    id { random_uuid }
    type 'derived'
    name 'factory visualization'
    privacy 'public'

    association :user, factory: :carto_user

    after(:create) do |visualization|
      permission = FactoryGirl.create :carto_permission,
                                      entity: visualization, owner: visualization.user, entity_type: 'vis'
      visualization.permission_id = permission.id
      visualization.save
      visualization.reload
    end

  end

end

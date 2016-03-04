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

    after(:create) do |visualization|
      permission = FactoryGirl.create :carto_permission,
                                      entity: visualization, owner: visualization.user, entity_type: 'vis'
      visualization.permission_id = permission.id
      visualization.save
      visualization.reload
    end

  end

end

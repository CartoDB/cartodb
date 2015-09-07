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

end

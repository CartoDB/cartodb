FactoryGirl.define do

  factory :map, class: Map do
  end

  factory :carto_map, class: Carto::Map do
    factory :carto_map_with_layers do
      ignore do
        layers_count 5
      end

      after(:create) do |map, evaluator|
        create_list(:carto_layer, evaluator.layers_count, maps: [map])
      end
    end
  end

end

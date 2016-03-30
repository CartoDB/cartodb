FactoryGirl.define do

  factory :map, class: Map do
  end

  factory :carto_map, class: Carto::Map do
    factory :carto_map_with_layers do

      after(:create) do |map, evaluator|
        create_list(:carto_tiled_layer, 1, maps: [map])
        create_list(:carto_layer, 1, maps: [map])
      end
    end
  end

end

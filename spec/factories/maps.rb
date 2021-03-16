FactoryBot.define do

  factory :map, class: Map do
    to_create(&:save)
  end

  factory :carto_map, class: Carto::Map do
    view_bounds_sw { '[-85.0511, -179]' }
    view_bounds_ne { '[85.0511, 179]' }

    factory :carto_map_with_layers do
      after(:create) do |map, evaluator|
        create_list(:carto_tiled_layer, 1, maps: [map])
        create_list(:carto_layer, 1, maps: [map])
        map.layers.map.with_index.map do |layer, index|
          layer.order = index
          layer.save
        end
      end
    end

    factory :carto_map_with_2_tiled_layers do
      after(:create) do |map, evaluator|
        create_list(:carto_tiled_layer, 1, maps: [map])
        create_list(:carto_layer, 1, maps: [map])
        create_list(:carto_tiled_layer, 1, maps: [map])
        map.layers.map.with_index.map do |layer, index|
          layer.order = index
          layer.save
        end
      end
    end

  end

end

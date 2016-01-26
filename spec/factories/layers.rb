FactoryGirl.define do

  factory :layer, class: Layer do
    order 1
    kind 'carto'
  end

  factory :carto_layer, class: Carto::Layer do
    order 1
    kind 'carto'
  end

end

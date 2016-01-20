FactoryGirl.define do

  factory :layer, class: Layer do
    order 1
  end

  factory :carto_layer, class: Carto::Layer do
    order 1
  end

end

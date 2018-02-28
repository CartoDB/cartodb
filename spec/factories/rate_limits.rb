FactoryGirl.define do
  factory :rate_limits, class: Carto::RateLimit do
    maps_anonymous    [0, 1, 2]
    maps_static       [3, 4, 5]
    maps_static_named [6, 7, 8]
    maps_dataview     [9, 10, 11]
    maps_analysis     [12, 13, 14]
    maps_tile         [15, 16, 17, 30, 32, 34]
    maps_attributes   [18, 19, 20]
    maps_named_list   [21, 22, 23]
    maps_named_create [24, 25, 26]
    maps_named_get    [27, 28, 29]
    maps_named        [30, 31, 32]
    maps_named_update [33, 34, 35]
    maps_named_delete [36, 37, 38]
    maps_named_tiles  [39, 40, 41]
  end

  factory :rate_limits_custom, class: Carto::RateLimit do
    maps_anonymous    [10, 11, 12]
    maps_static       [13, 14, 15]
    maps_static_named [16, 17, 18]
    maps_dataview     [19, 110, 111]
    maps_analysis     [112, 113, 114]
    maps_tile         [115, 116, 117, 230, 232, 234]
    maps_attributes   [118, 119, 120]
    maps_named_list   [121, 122, 123]
    maps_named_create [124, 125, 126]
    maps_named_get    [127, 128, 129]
    maps_named        [130, 131, 132]
    maps_named_update [133, 134, 135]
    maps_named_delete [136, 137, 138]
    maps_named_tiles  [139, 140, 141]
  end
end

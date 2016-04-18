FactoryGirl.define do

  factory :carto_overlay, class: Carto::Overlay do
    order 1
    options { { display: true, x: 60, y: 20 } }

    factory :carto_search_overlay do
      type 'search'
    end

    factory :carto_zoom_overlay do
      type 'zoom'
      template '<a href="#zoom_in" class="zoom_in">+</a> <a href="#zoom_out" class="zoom_out">-</a>'
    end
  end

end

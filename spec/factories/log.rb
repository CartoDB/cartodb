FactoryGirl.define do
  factory :log, class: CartoDB::Log do
  end

  factory :carto_log, class: Carto::Log do
  end
end

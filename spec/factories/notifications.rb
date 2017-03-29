FactoryGirl.define do
  factory :notification, class: Carto::Notification do
    body 'Hey there!'
    icon Carto::Notification::ICON_WARNING
  end
end

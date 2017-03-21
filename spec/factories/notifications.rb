FactoryGirl.define do
  factory :notification, class: Carto::Notification do
    body 'Hey there!'
    icon 'error'
  end
end

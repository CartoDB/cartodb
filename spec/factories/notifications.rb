require_relative '../../app/models/carto/widget'

FactoryGirl.define do
  factory :notification, class: Carto::Notification do
    icon Carto::Notification::ICON_ALERT
    body 'Empty body'
    recipients Carto::Notification::RECIPIENT_ALL
  end
end

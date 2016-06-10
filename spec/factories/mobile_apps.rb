# Read about factories at https://github.com/thoughtbot/factory_girl

require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do

  factory :mobile_app, class: Carto::MobileApp do
    id UUIDTools::UUID.timestamp_create.to_s
    name 'MyApp'
    description 'My app description'
    icon_url 'example.com/icon_url'
    platform 'android'
    app_type 'open'
    app_id 'com.example.mycartoapp'
    license_key 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
    monthly_users 100
  end
end

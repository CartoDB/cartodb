require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do
  factory :user_table, class: UserTable do
    name { unique_name('user_table') }
  end

  factory :carto_user_table, class: Carto::UserTable do
    name { unique_name('user_table') }

    factory :private_user_table do
      privacy Carto::UserTable::PRIVACY_PRIVATE
    end

    factory :public_user_table do
      privacy Carto::UserTable::PRIVACY_PUBLIC
    end
  end
end

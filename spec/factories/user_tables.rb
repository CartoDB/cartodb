require 'helpers/unique_names_helper'

include UniqueNamesHelper

FactoryGirl.define do
  factory :user_table, class: UserTable do
    to_create(&:save)

    name { unique_name('user_table') }
  end

  factory :carto_user_table, class: Carto::UserTable do
    name { unique_name('user_table') }

    before(:create) do |user_table|
      allow(user_table.service).to receive(:before_create)
      allow(user_table.service).to receive(:after_create)
      allow(user_table).to receive(:create_canonical_visualization)
      allow_any_instance_of(CartoDB::TablePrivacyManager).to receive(:apply_privacy_change)
    end

    after(:create) do |user_table|
      user_table.service.unstub(:before_create)
      user_table.service.unstub(:after_create)
      user_table.unstub(:create_canonical_visualization)
      CartoDB::TablePrivacyManager.any_instance.unstub(:apply_privacy_change)
    end

    trait :with_db_table do
      before(:create) do |user_table|
        user_table.service.unstub(:before_create)
        user_table.service.unstub(:after_create)
        CartoDB::TablePrivacyManager.any_instance.unstub(:apply_privacy_change)
      end
    end

    trait :with_canonical_visualization do
      before(:create) do |user_table|
        allow(user_table.service).to receive(:is_raster?).and_return(false)
        user_table.unstub(:create_canonical_visualization)
      end

      after(:create) do |user_table|
        user_table.service.unstub(:is_raster?)
      end
    end

    factory :carto_user_table_with_canonical, traits: [:with_canonical_visualization]

    trait :full do
      with_canonical_visualization
      with_db_table
    end

    factory :private_user_table do
      privacy Carto::UserTable::PRIVACY_PRIVATE
    end

    factory :public_user_table do
      privacy Carto::UserTable::PRIVACY_PUBLIC
    end
  end
end

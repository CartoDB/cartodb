# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/connectors/importer'
require_relative '../doubles/result'
require 'csv'

describe CartoDB::Importer2::Overviews do

  before(:all) do
    @user = create_user(:quota_in_bytes => 1000.megabyte, :table_quota => 400)
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'create_overviews', restricted: true)
  end

  before(:each) do
    stub_named_maps_calls
  end

  after(:all) do
    # TO delete a user we must reload it from the database, because
    # feature flags are memoized, and deleted in a before-destroy hook.
    # If feature_flags have changed some of them may not be deleted
    # before the user is deleted and that will prevent user deletion because
    # of a foreign key constraint in the feature_flags_users table.
    @user = User[@user.id]
    @user.destroy
    @feature_flag.destroy
  end

  def set_feature_flag(user, feature, state)
    # User memoizes feature flags information, so we need a fresh
    # object for accurate current feature flagas info
    # Note that User[user.id] can't be used here because it also caches results
    user = User.where(id: user.id).first
    if state != user.has_feature_flag?(feature)
      ff = FeatureFlag[name: feature]
      ffu = FeatureFlagsUser[feature_flag_id: ff.id, user_id: user.id]
      if state
        unless ffu
          FeatureFlagsUser.new(feature_flag_id: ff.id, user_id: user.id).save
        end
      else
        ff.update restricted: false unless ff.restricted
        ffu.delete if ffu
      end
      # Note that user.reload is not enough because user is not memoized
      # to return an up to date record
      user = User.where(id: user.id).first
    end
    user
  end

  def has_overviews?(user, table)
    overviews = user.in_database do |db|
      db.fetch %{
        SELECT CDB_Overviews('#{table}'::regclass)
      }
    end
    overviews.count > 0
  end

  def remove_overviews(user, table)
    user.in_database do |db|
      db.run %{
        SELECT CDB_DropOverviews('#{table}'::regclass)
      }
    end
  end

  def cleanup_import(user, table)
  end

  it 'should not create overviews if the feature flag is not enabled' do
    user = set_feature_flag @user, 'create_overviews', false
    Cartodb.with_config overviews: { 'min_rows'=>500 } do
      user.has_feature_flag?('create_overviews').should eq false
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        :user_id       => user.id,
        :data_source   => filepath,
        :updated_at    => Time.now,
        :append        => false,
        :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(user, table_name).should eq false
      remove_overviews user, table_name
      has_overviews?(user, table_name).should eq false
    end
  end

  it 'should not create overviews for small datasets' do
    user = set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows'=>1000 } do
      user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 1000

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        :user_id       => user.id,
        :data_source   => filepath,
        :updated_at    => Time.now,
        :append        => false,
        :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(user, table_name).should eq false
      remove_overviews user, table_name
      has_overviews?(user, table_name).should eq false
    end
  end

  it 'should not create overviews for datasets with non-supported geometries' do
    user = set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows'=>100 } do
      user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 100

      # countries_simplified is a ~200 polygons dataset
      filepath = "#{Rails.root}/spec/support/data/countries_simplified.zip"
      data_import = DataImport.create(
        :user_id       => user.id,
        :data_source   => filepath,
        :updated_at    => Time.now,
        :append        => false,
        :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(user, table_name).should eq false
      remove_overviews user, table_name
      has_overviews?(user, table_name).should eq false
    end
  end

  it 'should create overviews for large datasets of the correct geometry kind' do
    user = set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows'=>500 } do
      user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        :user_id       => user.id,
        :data_source   => filepath,
        :updated_at    => Time.now,
        :append        => false,
        :privacy       => (::UserTable::PRIVACY_VALUES_TO_TEXTS.invert)['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(user, table_name).should eq true
      remove_overviews user, table_name
      has_overviews?(user, table_name).should eq false
    end
  end
end

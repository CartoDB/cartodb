# encoding: utf-8

require_relative '../../spec_helper'

require_relative '../../../services/data-repository/backend/sequel'
require_relative '../../../services/data-repository/repository'
require_relative '../../../app/models/synchronization/member'
require 'helpers/unique_names_helper'
require 'helpers/file_server_helper'
require_relative '../../helpers/feature_flag_helper'

include UniqueNamesHelper
include CartoDB

describe Synchronization::Member do

  describe "synchronizations" do
    before(:all) do
      @user1 = create_user(sync_tables_enabled: true)
      @user2 = create_user(sync_tables_enabled: true)
      @feature_flag = FactoryGirl.create(:feature_flag, name: 'create_overviews', restricted: true)
    end

    before(:each) do
      bypass_named_maps
    end

    around(:each) do |example|
      Cartodb.with_config(metrics: {}, &example)
    end

    after(:all) do
      @user1.destroy
      @user2.destroy
    end

    include FeatureFlagHelper

    def overview_tables(user, table)
      overviews = user.in_database do |db|
        db.fetch %{
          SELECT * FROM CDB_Overviews('#{table}'::regclass)
        }
      end
      overviews.map(:overview_table)
    end

    def has_overviews?(user, table)
      !overview_tables(user, table).empty?
    end

    def remove_overviews(user, table)
      user.in_database do |db|
        db.run %{
          SELECT CDB_DropOverviews('#{table}'::regclass)
        }
      end
    end

    describe "synchronization" do
      it 'creates overviews' do
        CartoDB::Logger.stubs(:error).never

        url = 'https://wadus.com/cities-box.csv'
        path = "#{Rails.root}/spec/support/data/cities-box.csv"
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user1.id).merge(service_item_id: url, url: url, name: 'cities_box')
        member = Synchronization::Member.new(attrs).store

        set_feature_flag @user1, 'create_overviews', true

        # Import data without overviews needed (too few rows for overviews)
        data_import = Cartodb.with_config overviews: { 'min_rows' => 1000 } do
          DataImport.create(
            user_id: @user1.id,
            data_source: path,
            synchronization_id: member.id,
            service_name: 'public_url',
            service_item_id: url,
            updated_at: Time.now,
            privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
          ).run_import!
        end
        table_name = UserTable[id: data_import.table.id].name
        has_overviews?(@user1, table_name).should eq false

        # Now synchronize with overviews needed
        Cartodb.with_config overviews: { 'min_rows' => 100 } do
          member.run
        end
        has_overviews?(@user1, table_name).should eq true
      end

      it 'deletes overviews' do
        CartoDB::Logger.stubs(:error).never

        url = 'https://wadus.com/cities-box.csv'
        path = "#{Rails.root}/spec/support/data/cities-box.csv"
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user1.id).merge(service_item_id: url, url: url, name: 'cities_box')
        member = Synchronization::Member.new(attrs).store

        set_feature_flag @user1, 'create_overviews', true

        # Import data with overviews needed (too few rows for overviews)
        data_import = Cartodb.with_config overviews: { 'min_rows' => 100 } do
          DataImport.create(
            user_id: @user1.id,
            data_source: path,
            synchronization_id: member.id,
            service_name: 'public_url',
            service_item_id: url,
            updated_at: Time.now,
            privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
          ).run_import!
        end
        table_name = UserTable[id: data_import.table.id].name
        member.name = table_name
        has_overviews?(@user1, table_name).should eq true

        # Now synchronize without overviews needed
        Cartodb.with_config overviews: { 'min_rows' => 1000 } do
          member.run
        end
        has_overviews?(@user1, table_name).should eq false
      end

      it 'updates overviews' do
        CartoDB::Logger.stubs(:error).never

        url = 'https://wadus.com/cities-box.csv'
        path = "#{Rails.root}/spec/support/data/cities-box.csv"
        stub_download(url: url, filepath: path, content_disposition: false)

        attrs = random_attributes(user_id: @user1.id).merge(service_item_id: url, url: url, name: 'cities_box')
        member = Synchronization::Member.new(attrs).store

        set_feature_flag @user1, 'create_overviews', true

        # Import data with overviews needed (too few rows for overviews)
        data_import = Cartodb.with_config overviews: { 'min_rows' => 100 } do
          DataImport.create(
            user_id: @user1.id,
            data_source: path,
            synchronization_id: member.id,
            service_name: 'public_url',
            service_item_id: url,
            updated_at: Time.now,
            privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
          ).run_import!
        end
        table_name = UserTable[id: data_import.table.id].name
        has_overviews?(@user1, table_name).should eq true

        # Now synchronize with overviews needed
        # TODO: alter or delete overviews contents and check they're are re-generated
        Cartodb.with_config overviews: { 'min_rows' => 100 } do
          member.run
        end
        has_overviews?(@user1, table_name).should eq true
      end
    end
  end

  private

  def random_attributes(attributes = {})
    random = unique_integer
    {
      name:       attributes.fetch(:name, "name#{random}"),
      interval:   attributes.fetch(:interval, 15 * 60 + random),
      state:      attributes.fetch(:state, 'enabled'),
      user_id:    attributes.fetch(:user_id, nil)
    }
  end
end

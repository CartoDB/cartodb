# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/connectors/importer'
require_relative '../doubles/result'
require 'csv'

describe CartoDB::Importer2::Overviews do
  before(:all) do
    @user = create_user(quota_in_bytes: 1000.megabyte, table_quota: 400)
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'create_overviews', restricted: true)
  end

  before(:each) do
    stub_named_maps_calls
  end

  after(:all) do
    @user.destroy
    @feature_flag.destroy
  end

  def set_feature_flag(user, feature, state)
    user.reload
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
      user.reload
    end
    user
  end

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

  def table_privileges(user, table)
    privileges = user.in_database do |db|
      db.fetch %{
        SELECT relacl
        FROM pg_class
        WHERE oid = '#{table}'::regclass;
      }
    end
    privileges.map(:relacl).first
  end

  def public_table?(user, table)
    !!(table_privileges(user, table) =~ /publicuser/)
  end

  def set_table_privacy(table, privacy)
    CartoDB::TablePrivacyManager.new(table)
                                .send(:set_from_table_privacy, privacy)
                                .update_cdb_tablemetadata
  end

  it 'should not create overviews if the feature flag is not enabled' do
    set_feature_flag @user, 'create_overviews', false
    Cartodb.with_config overviews: { 'min_rows' => 500 } do
      @user.has_feature_flag?('create_overviews').should eq false
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        user_id:     @user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(@user, table_name).should eq false
      remove_overviews @user, table_name
      has_overviews?(@user, table_name).should eq false
    end
  end

  it 'should not create overviews for small datasets' do
    set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 1000 } do
      @user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 1000

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        user_id:     @user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(@user, table_name).should eq false
      remove_overviews @user, table_name
      has_overviews?(@user, table_name).should eq false
    end
  end

  it 'should not create overviews for datasets with non-supported geometries' do
    set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 100 } do
      @user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 100

      # countries_simplified is a ~200 polygons dataset
      filepath = "#{Rails.root}/spec/support/data/countries_simplified.zip"
      data_import = DataImport.create(
        user_id:     @user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(@user, table_name).should eq false
      remove_overviews @user, table_name
      has_overviews?(@user, table_name).should eq false
    end
  end

  it 'should create overviews for large datasets of the correct geometry kind' do
    set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 500 } do
      @user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        user_id:     @user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(@user, table_name).should eq true
      remove_overviews @user, table_name
      has_overviews?(@user, table_name).should eq false
    end
  end

  it 'should remove overviews when the table is deleted' do
    set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 500 } do
      @user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        user_id:     @user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table = UserTable[id: data_import.table.id]
      ov_tables = overview_tables(@user, table.name)
      ov_tables.size.should > 0
      table.destroy
      ov_tables.each do |ov_table|
        expect do
          @user.in_database do |db|
            db.run "SELECT '#{ov_table}'::regclass"
          end
        end.to raise_error(Sequel::DatabaseError, /relation .+ does not exist/)
      end
    end
  end

  it 'should rename overviews when the table is renamed' do
    set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 500 } do
      @user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        user_id:     @user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table = UserTable[id: data_import.table.id]
      ov_tables = overview_tables(@user, table.name)
      ov_tables.size.should > 0
      table.service.name = 'cities2_box'
      (!!table.save).should eq true
      table.save.name.should eq 'cities2_box'
      ov_tables.each do |ov_table|
        expect do
          @user.in_database do |db|
            db.run "SELECT '#{ov_table}'::regclass"
          end
        end.to raise_error(Sequel::DatabaseError, /relation .+ does not exist/)
      end
      ov_tables = overview_tables(@user, table.name)
      ov_tables.size.should > 0
    end
  end

  it 'synchronize overviews privacy with that of the base table' do
    user = create_user(quota_in_bytes: 1000.megabyte, table_quota: 400, private_tables_enabled: true)
    set_feature_flag user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 500 } do
      user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      public_privacy  = ::UserTable::PRIVACY_PUBLIC
      private_privacy = ::UserTable::PRIVACY_PRIVATE
      link_privacy    = ::UserTable::PRIVACY_LINK

      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        user_id:     user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     private_privacy
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table = UserTable[id: data_import.table.id]
      has_overviews?(user, table.name).should eq true
      ov_tables = overview_tables(user, table.name)
      # Check overviews are private
      ov_tables.any?{ |ov_table| public_table?(user, ov_table) }.should eq false

      set_table_privacy table, public_privacy
      # Check overviews are public
      ov_tables.all?{ |ov_table| public_table?(user, ov_table) }.should eq true

      set_table_privacy table, private_privacy
      # Check overviews are private
      ov_tables.any?{ |ov_table| public_table?(user, ov_table) }.should eq false

      set_table_privacy table, link_privacy
      # Check overviews are public
      ov_tables.all?{ |ov_table| public_table?(user, ov_table) }.should eq true
    end
  end

  it 'should use the overviews-specific statement timeout' do
    set_feature_flag @user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 500, 'statement_timeout' => 1 } do
      @user.has_feature_flag?('create_overviews').should eq true
      Cartodb.get_config(:overviews, 'min_rows').should eq 500

      # cities_box is a ~900 points dataset
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"
      data_import = DataImport.create(
        user_id:     @user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_VALUES_TO_TEXTS.invert['public']
      )
      data_import.values[:data_source] = filepath

      # avoid noisy error messages
      data_import.stubs(:puts)
      CartoDB.stubs(:notify_error)

      expect { data_import.run_import! }.to raise_error(Sequel::DatabaseError)
      data_import.success.should eq false
      data_import.log.entries.should match(/canceling statement due to statement timeout/)
    end
  end
end

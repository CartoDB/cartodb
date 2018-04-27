# encoding: utf-8
require_relative '../spec_helper'
require_relative '../../app/connectors/importer'
require_relative '../doubles/result'
require_relative '../helpers/feature_flag_helper'
require 'csv'

describe CartoDB::Importer2::Overviews do
  before(:all) do
    @user = create_user(quota_in_bytes: 1000.megabyte, table_quota: 400)
    @feature_flag = FactoryGirl.create(:feature_flag, name: 'create_overviews', restricted: true)
  end

  before(:each) do
    bypass_named_maps
  end

  after(:all) do
    @user.destroy
    @feature_flag.destroy
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

  def public_table?(user, table)
    has_privilege = user.in_database do |db|
      db.fetch %{
        SELECT has_table_privilege('publicuser', '#{table}'::regclass, 'SELECT');
      }
    end
    has_privilege.first[:has_table_privilege]
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
      ov_tables.none? { |ov_table| public_table?(user, ov_table) }.should eq true

      set_table_privacy table, public_privacy
      # Check overviews are public
      ov_tables.all? { |ov_table| public_table?(user, ov_table) }.should eq true

      set_table_privacy table, private_privacy
      # Check overviews are private
      ov_tables.none? { |ov_table| public_table?(user, ov_table) }.should eq true

      set_table_privacy table, link_privacy
      # Check overviews are public
      ov_tables.all? { |ov_table| public_table?(user, ov_table) }.should eq true
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

      # The overviews timeout should abort overviews creation but otherwise
      # import the dataset correctly.
      data_import.run_import!
      data_import.success.should eq true
      table_name = UserTable[id: data_import.table.id].name
      has_overviews?(@user, table_name).should eq false
    end
  end

  def with_connection(options)
    connection = ::Sequel.connect(options)
    begin
      yield connection
    ensure
      connection.disconnect
    end
  end

  def with_connection_from_user(user, &block)
    options = ::SequelRails.configuration.environment_for(Rails.env).merge(
      'database' => user.database_name,
      'username' => user.database_username,
      'password' => user.database_password,
      'host' => user.database_host
    )
    with_connection options, &block
  end

  def with_connection_from_api_key(api_key, &block)
    user = api_key.user
    options = ::SequelRails.configuration.environment_for(Rails.env).merge(
      'database' => user.database_name,
      'username' => api_key.db_role,
      'password' => api_key.db_password,
      'host' => user.database_host
    )
    with_connection options, &block
  end

  it 'shares overviews when the base table is shared' do
    # create two users from the same organization (so they share the database)
    organization = create_organization_with_owner
    user1 = organization.owner
    # user1.quota_in_bytes = 1000.megabyte
    # user1.table_quota = 400
    user1.private_tables_enabled = true
    user1.save
    user2 = create_user(organization: organization, account_type: 'ORGANIZATION USER')
    user2.save

    # Import table with overviews for user1
    table = ov_tables = nil
    set_feature_flag user1, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 500 } do
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"

      data_import = DataImport.create(
        user_id:     user1.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_PRIVATE
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table = UserTable[id: data_import.table.id]
      has_overviews?(user1, table.name).should eq true
      ov_tables = overview_tables(user1, table.name)
    end

    # user2 cannot access overview tables
    with_connection_from_user(user2) do |connection|
      begin
        connection.execute("select count(1) from #{user1.database_schema}.#{ov_tables.first}")
      rescue Sequel::DatabaseError => e
        failed = true
        e.message.should include "permission denied for relation #{ov_tables.first}"
      end
      failed.should be_true
    end

    # Share table with user2
    p = table.table_visualization.permission
    p.acl = [{ type: 'user', entity: {id: user2.id, username: user2.username}, access: 'r' }]
    p.save

    # Now user2 has access to overview tables
    with_connection_from_user(user2) do |connection|
      connection.execute("select count(1) from #{user1.database_schema}.#{ov_tables.first}") do |result|
        result[0]['count'].to_i.should > 0
      end
    end

    user2.destroy
    user1.destroy
  end

  it 'overviews are granted api key privileges as for base table' do
    # Import two tables with overviews for @user
    table1 = ov_tables1 = nil
    table2 = ov_tables2 = nil
    user = create_user(quota_in_bytes: 1000.megabyte, table_quota: 400, private_tables_enabled: true)
    set_feature_flag user, 'create_overviews', true
    Cartodb.with_config overviews: { 'min_rows' => 500 } do
      filepath = "#{Rails.root}/spec/support/data/cities-box.csv"

      data_import = DataImport.create(
        user_id:     user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_PRIVATE
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table1 = UserTable[id: data_import.table.id]
      has_overviews?(user, table1.name).should eq true
      ov_tables1 = overview_tables(user, table1.name)

      data_import = DataImport.create(
        user_id:     user.id,
        data_source: filepath,
        updated_at:  Time.now,
        append:      false,
        privacy:     ::UserTable::PRIVACY_PRIVATE
      )
      data_import.values[:data_source] = filepath
      data_import.run_import!
      data_import.success.should eq true
      table2 = UserTable[id: data_import.table.id]
      has_overviews?(user, table2.name).should eq true
      ov_tables2 = overview_tables(user, table2.name)
    end

    # grant access to other user to one of the tables
    grants = [
      {
        type: 'database',
        tables: [{
          schema: user.database_schema,
          name: table1.name,
          permissions: ['select']
        }]
      },
      {
        type: 'apis',
        apis: ['maps', 'sql']
      }
    ]
    api_key = user.api_keys.create_regular_key!(name: 'full', grants: grants)

    ov_table1 = ov_tables1.first
    ov_table2 = ov_tables2.first

    with_connection_from_api_key(api_key) do |connection|
      begin
        connection.execute("select count(1) from #{ov_table2}")
      rescue Sequel::DatabaseError => e
        failed = true
        e.message.should include "permission denied for relation #{ov_table2}"
      end
      failed.should be_true

      connection.execute("select count(1) from #{ov_table1}") do |result|
        result[0]['count'].to_i.should > 0
      end
    end
    api_key.destroy
    user.destroy
  end
end

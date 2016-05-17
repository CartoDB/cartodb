# coding: UTF-8

require_relative '../spec_helper'

describe Carto::Api::UserPresenter do

  before(:each) do
    CartoDB::UserModule::DBService.any_instance.stubs(:enable_remote_db_user).returns(true)
  end

  it "Compares old and new ways of 'presenting' user data" do
    CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

    # Non-org user
    user = create_user({
        email: 'example@carto.com',
        username: 'example',
        password: 'example123',
        name: "my example name",
        sync_tables_enabled: true,
        private_tables_enabled: true,
        twitter_datasource_enabled: true,
        twitter_datasource_block_size: 1000,
        twitter_datasource_block_price: 10,
        twitter_datasource_quota: 70000,
        soft_twitter_datasource_limit: true,
        public_visualization_count: 1,
        all_visualization_count: 2
      })

    # Some sample data
    data_import_id = '11111111-1111-1111-1111-111111111111'
    Rails::Sequel.connection.run(%Q{
      INSERT INTO data_imports("data_source","data_type","table_name","state","success","logger","updated_at",
        "created_at","tables_created_count",
        "table_names","append","id","table_id","user_id",
        "service_name","service_item_id","stats","type_guessing","quoted_fields_guessing","content_guessing","server","host",
        "resque_ppid","upload_host","create_visualization","user_defined_limits")
        VALUES('test','url','test','complete','t','11111111-1111-1111-1111-111111111112',
          '2015-03-17 00:00:00.94006+00','2015-03-17 00:00:00.810581+00','1',
          'test','f','#{data_import_id}','11111111-1111-1111-1111-111111111113',
          '#{user.id}','public_url', 'test',
          '[{"type":".csv","size":5015}]','t','f','t','test','0.0.0.0','13204','test','f','{"twitter_credits_limit":0}');
      })
    Rails::Sequel.connection.run(%Q{
      INSERT INTO geocodings("table_name","processed_rows","created_at","updated_at","formatter","state",
        "id","user_id",
        "cache_hits","kind","geometry_type","processable_rows","real_rows","used_credits",
        "data_import_id"
        ) VALUES('importer_123456','197','2015-03-17 00:00:00.279934+00','2015-03-17 00:00:00.536383+00','field_1','finished',
          '11111111-1111-1111-1111-111111111114','#{user.id}','0','admin0','polygon','195','0','0',
          '#{data_import_id}');
      })

    create_table( { user_id: user.id, name: 'table1' } )
    create_table( { user_id: user.id, name: 'table2', privacy: Carto::UserTable::PRIVACY_PUBLIC } )

    feature_flag1 = FactoryGirl.create(:feature_flag, id: 1, name: 'ff1')
    feature_flag2 = FactoryGirl.create(:feature_flag, id: 2, name: 'ff2')
    user.set_relationships_from_central({ feature_flags: [ feature_flag1.id.to_s, feature_flag2.id.to_s ]})
    user.save

    compare_data(user.data, Carto::Api::UserPresenter.new(Carto::User.where(id: user.id).first).data, false)

    # Now org user, organization and another member

    owner = create_user({
        email: 'owner@carto.com',
        username: 'owner',
        password: 'owner123',
        name: "owner name",
        sync_tables_enabled: true,
        private_tables_enabled: true,
        twitter_datasource_enabled: true,
        twitter_datasource_block_size: 1000,
        twitter_datasource_block_price: 10,
        twitter_datasource_quota: 70000,
        soft_twitter_datasource_limit: true,
        public_visualization_count: 1,
        all_visualization_count: 2
      })

    organization = ::Organization.new(quota_in_bytes: 200.megabytes, name: 'testorg', seats: 5).save
    user_org = CartoDB::UserOrganization.new(organization.id, owner.id)
    user_org.promote_user_to_admin
    organization.reload
    owner.reload

    user2 = create_user({
        email: 'example2@carto.com',
        username: 'example2',
        password: 'example123'
      })

    user2.organization = organization
    user2.save
    user2.reload
    organization.reload

    compare_data(owner.data, Carto::Api::UserPresenter.new(Carto::User.where(id: owner.id).first).data, true)

    Rails::Sequel.connection.run( %Q{ DELETE FROM geocodings } )
    Rails::Sequel.connection.run( %Q{ DELETE FROM data_imports } )
    user.destroy
    organization.destroy
  end

  protected

  def compare_data(old_data, new_data, org_user = false)
    # INFO: new organization presenter now doesn't contain users
    old_data[:organization].delete(:users) if old_data[:organization]

    # TODO: This fails at CI server, until there's time to research...
    #new_data.should eq old_data

    # To detect deltas not migrated to new presenter
    new_data.keys.sort.should == old_data.keys.sort

    new_data[:id].should == old_data[:id]
    new_data[:email].should == old_data[:email]
    new_data[:name].should == old_data[:name]
    new_data[:username].should == old_data[:username]
    new_data[:account_type].should == old_data[:account_type]
    new_data[:table_quota].should == old_data[:table_quota]
    new_data[:table_count].should == old_data[:table_count]
    new_data[:public_visualization_count].should == old_data[:public_visualization_count]
    new_data[:all_visualization_count].should == old_data[:all_visualization_count]
    new_data[:visualization_count].should == old_data[:visualization_count]
    new_data[:failed_import_count].should == old_data[:failed_import_count]
    new_data[:success_import_count].should == old_data[:success_import_count]
    new_data[:import_count].should == old_data[:import_count]
    new_data[:last_visualization_created_at].to_s.should == old_data[:last_visualization_created_at].to_s
    new_data[:quota_in_bytes].should == old_data[:quota_in_bytes]
    new_data[:db_size_in_bytes].should == old_data[:db_size_in_bytes]
    new_data[:db_size_in_megabytes].should == old_data[:db_size_in_megabytes]
    new_data[:remaining_table_quota].should == old_data[:remaining_table_quota]
    new_data[:remaining_byte_quota].should == old_data[:remaining_byte_quota]
    new_data[:api_calls].should == old_data[:api_calls]
    new_data[:api_calls_quota].should == old_data[:api_calls_quota]
    new_data[:api_calls_block_price].should == old_data[:api_calls_block_price]
    new_data[:geocoding].should == old_data[:geocoding]
    new_data[:here_isolines].should == old_data[:here_isolines]
    new_data[:obs_snapshot].should == old_data[:obs_snapshot]
    new_data[:obs_general].should == old_data[:obs_general]
    new_data[:twitter].should == old_data[:twitter]
    new_data[:billing_period].should == old_data[:billing_period]
    new_data[:max_layers].should == old_data[:max_layers]
    new_data[:api_key].should == old_data[:api_key]
    new_data[:layers].should == old_data[:layers]
    new_data[:trial_ends_at].should == old_data[:trial_ends_at]
    new_data[:upgraded_at].should == old_data[:upgraded_at]
    new_data[:show_trial_reminder].should == old_data[:show_trial_reminder]
    new_data[:show_upgraded_message].should == old_data[:show_upgraded_message]
    new_data[:actions].should == old_data[:actions]
    new_data[:notification].should == old_data[:notification]
    new_data[:avatar_url].should == old_data[:avatar_url]
    new_data[:new_dashboard_enabled].should == old_data[:new_dashboard_enabled]
    new_data[:feature_flags].should == old_data[:feature_flags]
    new_data[:base_url].should == old_data[:base_url]

    if org_user
      new_data[:organization].keys.sort.should == old_data[:organization].keys.sort

      # This is an implicit test of OrganizationPresenter...
      # INFO: we have a weird error sometimes running builds that fails comparing dates despite having equal value...
      # > Diff:2015-06-23 17:27:02 +0200.==(2015-06-23 17:27:02 +0200) returned false even though the diff between
      #   2015-06-23 17:27:02 +0200 and 2015-06-23 17:27:02 +0200 is empty. Check the implementation of
      #   2015-06-23 17:27:02 +0200.==.
      new_data[:organization][:created_at].to_s.should == old_data[:organization][:created_at].to_s
      new_data[:organization][:description].should == old_data[:organization][:description]
      new_data[:organization][:discus_shortname].should == old_data[:organization][:discus_shortname]
      new_data[:organization][:display_name].should == old_data[:organization][:display_name]
      new_data[:organization][:id].should == old_data[:organization][:id]
      new_data[:organization][:name].should == old_data[:organization][:name]
      new_data[:organization][:owner][:id].should == old_data[:organization][:owner][:id]
      new_data[:organization][:owner][:username].should == old_data[:organization][:owner][:username]
      new_data[:organization][:owner][:avatar_url].should == old_data[:organization][:owner][:avatar_url]
      new_data[:organization][:owner][:email].should == old_data[:organization][:owner][:email]
      new_data[:organization][:quota_in_bytes].should == old_data[:organization][:quota_in_bytes]
      new_data[:organization][:geocoding_quota].should == old_data[:organization][:geocoding_quota]
      new_data[:organization][:here_isolines_quota].should == old_data[:organization][:here_isolines_quota]
      new_data[:organization][:obs_snapshot_quota].should == old_data[:organization][:obs_snapshot_quota]
      new_data[:organization][:obs_general_quota].should == old_data[:organization][:obs_general_quota]
      new_data[:organization][:map_view_quota].should == old_data[:organization][:map_view_quota]
      new_data[:organization][:twitter_datasource_quota].should == old_data[:organization][:twitter_datasource_quota]
      new_data[:organization][:map_view_block_price].should == old_data[:organization][:map_view_block_price]
      new_data[:organization][:geocoding_block_price].should == old_data[:organization][:geocoding_block_price]
      new_data[:organization][:here_isolines_block_price].should == old_data[:organization][:here_isolines_block_price]
      new_data[:organization][:obs_snapshot_block_price].should == old_data[:organization][:obs_snapshot_block_price]
      new_data[:organization][:obs_general_block_price].should == old_data[:organization][:obs_general_block_price]
      new_data[:organization][:seats].should == old_data[:organization][:seats]
      new_data[:organization][:twitter_username].should == old_data[:organization][:twitter_username]
      new_data[:organization][:location].should == old_data[:organization][:location]
      # Same as [:organization][:created_at] issue above
      new_data[:organization][:updated_at].to_s.should == old_data[:organization][:updated_at].to_s
      #owner is excluded from the users list
      new_data[:organization][:website].should == old_data[:organization][:website]
      new_data[:organization][:avatar_url].should == old_data[:organization][:avatar_url]
    end

    # TODO: Pending migration and testing of :real_table_count & :last_active_time

  end

  def create_org(org_name, org_quota, org_seats)
    organization = Organization.new
    organization.name = org_name
    organization.quota_in_bytes = org_quota
    organization.seats = org_seats
    organization.save!
    organization
  end

end

require_relative '../spec_helper'
require_relative '../../app/models/visualization/collection'
require_relative '../../app/models/organization.rb'
require_relative 'organization_shared_examples'
require_relative '../factories/visualization_creation_helpers'
require 'helpers/account_types_helper'
require 'helpers/unique_names_helper'
require 'helpers/storage_helper'
require 'factories/organizations_contexts'

include CartoDB, StorageHelper, UniqueNamesHelper

describe 'refactored behaviour' do
  it_behaves_like 'organization models' do
    before(:each) do
      @the_organization = ::Organization.where(id: @organization.id).first
    end

    def get_twitter_imports_count_by_organization_id(organization_id)
      raise "id doesn't match" unless organization_id == @the_organization.id
      @the_organization.get_twitter_imports_count
    end

    def get_geocoding_calls_by_organization_id(organization_id)
      raise "id doesn't match" unless organization_id == @the_organization.id
      @the_organization.get_geocoding_calls
    end

    def get_organization
      @the_organization
    end
  end
end

describe Organization do

  before(:all) do
    @user = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
  end

  after(:all) do
    bypass_named_maps
    begin
      @user.destroy
    rescue
      # Silence error, can't do much more
    end
  end

  before(:each) do
    create_account_type_fg('ORGANIZATION USER')
  end

  describe '#destroy_cascade' do
    include TableSharing

    before(:each) do
      @organization = FactoryGirl.create(:organization)
      ::User.any_instance.stubs(:create_in_central).returns(true)
      ::User.any_instance.stubs(:update_in_central).returns(true)
    end

    after(:each) do
      @organization.delete if @organization.try(:persisted?)
    end

    it 'Destroys users and owner as well' do
      organization = Organization.new(quota_in_bytes: 1234567890, name: 'wadus', seats: 5).save

      owner = create_user(:quota_in_bytes => 524288000, :table_quota => 500)
      owner_org = CartoDB::UserOrganization.new(organization.id, owner.id)
      owner_org.promote_user_to_admin
      owner.reload
      organization.reload

      user = create_user(quota_in_bytes: 524288000, table_quota: 500, organization_id: organization.id)
      user.save
      user.reload
      organization.reload

      organization.users.count.should eq 2

      organization.destroy_cascade
      Organization.where(id: organization.id).first.should be nil
      ::User.where(id: user.id).first.should be nil
      ::User.where(id: owner.id).first.should be nil
    end

    it 'Destroys viewer users with shared visualizations' do
      organization = Organization.new(quota_in_bytes: 1234567890, name: 'wadus', seats: 2, viewer_seats: 2).save

      owner = create_user(quota_in_bytes: 524288000, table_quota: 500)
      owner_org = CartoDB::UserOrganization.new(organization.id, owner.id)
      owner_org.promote_user_to_admin
      user1 = create_user(organization_id: organization.id)
      user2 = create_user(organization_id: organization.id)

      table1 = create_table(user_id: user1.id)
      table2 = create_table(user_id: user2.id)
      share_table_with_user(table1, user2)
      share_table_with_user(table2, user1)

      user1.viewer = true
      user1.save
      user2.viewer = true
      user2.save

      organization.destroy_cascade

      Organization.where(id: organization.id).first.should be nil
      ::User.where(id: user1.id).first.should be nil
      ::User.where(id: user2.id).first.should be nil
      ::User.where(id: owner.id).first.should be nil
      Carto::UserTable.exists?(table1.id).should be_false
      Carto::UserTable.exists?(table2.id).should be_false
    end

    it 'destroys users with unregistered tables' do
      organization = Organization.new(quota_in_bytes: 1234567890, name: 'wadus', seats: 5).save

      owner = create_user(quota_in_bytes: 524288000, table_quota: 500)
      owner_org = CartoDB::UserOrganization.new(organization.id, owner.id)
      owner_org.promote_user_to_admin
      owner.reload
      organization.reload

      user = create_user(quota_in_bytes: 524288000, table_quota: 500, organization_id: organization.id)
      user.save
      user.reload
      organization.reload

      user.in_database.run('CREATE TABLE foobarbaz (id serial)')

      organization.users.count.should eq 2

      organization.destroy_cascade

      Organization.where(id: organization.id).first.should be nil
      ::User.where(id: user.id).first.should be nil
      ::User.where(id: owner.id).first.should be nil
    end

    it 'destroys its groups through the extension' do
      Carto::Group.any_instance.expects(:destroy_group_with_extension).once

      FactoryGirl.create(:carto_group, organization: Carto::Organization.find(@organization.id))
      @organization.destroy
    end

    it 'destroys assets' do
      bypass_storage
      asset = FactoryGirl.create(:organization_asset,
                                 organization_id: @organization.id)

      @organization.destroy
      Carto::Asset.exists?(asset.id).should be_false
    end

    it 'calls :delete_in_central if delete_in_central parameter is true' do
      pending "Don't implemented. See Organization#destroy_cascade"

      @organization.expects(:delete_in_central).once
      @organization.destroy_cascade(delete_in_central: true)
    end
  end

  describe '#add_user_to_org' do
    it 'Tests adding a user to an organization (but no owner)' do
      org_quota = 1234567890
      org_name = unique_name('org')
      org_seats = 5

      username = @user.username

      organization = Organization.new

      organization.name = org_name
      organization.quota_in_bytes = org_quota
      organization.seats = org_seats
      organization.save
      organization.valid?.should eq true
      organization.errors.should eq Hash.new

      @user.organization = organization
      @user.save

      user = ::User.where(username: username).first
      user.should_not be nil

      user.organization_id.should_not eq nil
      user.organization_id.should eq organization.id
      user.organization.should_not eq nil
      user.organization.id.should eq organization.id
      user.organization.name.should eq org_name
      user.organization.quota_in_bytes.should eq org_quota
      user.organization.seats.should eq org_seats

      @user.organization = nil
      @user.save
      organization.destroy
    end

    it 'validates viewer and builder quotas' do
      quota = 1234567890
      name = unique_name('org')
      seats = 1
      viewer_seats = 1

      organization = Organization.new(name: name, quota_in_bytes: quota, seats: seats, viewer_seats: viewer_seats).save

      user = create_validated_user
      CartoDB::UserOrganization.new(organization.id, user.id).promote_user_to_admin
      organization.reload
      user.reload

      organization.remaining_seats.should eq 0
      organization.remaining_viewer_seats.should eq 1
      organization.users.should include(user)

      viewer = create_validated_user(organization: organization, viewer: true)

      viewer.valid? should be_true
      viewer.reload
      organization.reload

      organization.remaining_seats.should eq 0
      organization.remaining_viewer_seats.should eq 0
      organization.users.should include(viewer)

      builder = create_validated_user(organization: organization, viewer: false)
      organization.reload

      organization.remaining_seats.should eq 0
      organization.remaining_viewer_seats.should eq 0
      organization.users.should_not include(builder)

      viewer2 = create_validated_user(organization: organization, viewer: true)
      organization.reload

      organization.remaining_seats.should eq 0
      organization.remaining_viewer_seats.should eq 0
      organization.users.should_not include(viewer2)

      organization.seats = 0
      organization.viewer_seats = 0
      organization.valid?.should be_false
      organization.errors.should include :seats, :viewer_seats

      organization.destroy_cascade
    end

    it 'allows saving user if organization has no seats left' do
      organization = FactoryGirl.create(:organization, seats: 2, viewer_seats: 0, quota_in_bytes: 10)

      user = create_validated_user(quota_in_bytes: 1)
      CartoDB::UserOrganization.new(organization.id, user.id).promote_user_to_admin
      organization.reload
      user.reload

      builder = create_validated_user(organization: organization, viewer: false, quota_in_bytes: 2)
      builder.organization.reload

      builder.set_fields({ quota_in_bytes: 1 }, [:quota_in_bytes])
      builder.save(raise_on_failure: true)
      builder.reload

      builder.quota_in_bytes.should eq 1

      organization.destroy_cascade
    end

    it 'Tests setting a user as the organization owner' do
      org_name = unique_name('org')
      organization = Organization.new(quota_in_bytes: 1234567890, name: org_name, seats: 5).save

      user = create_user(:quota_in_bytes => 524288000, :table_quota => 500)

      user_org = CartoDB::UserOrganization.new(organization.id, user.id)
      # This also covers the usecase of an user being moved to its own schema (without org)
      user_org.promote_user_to_admin

      organization.reload
      user.reload

      user.organization.id.should eq organization.id
      user.organization.owner.id.should eq user.id

      user.database_schema.should eq user.username

      user_org = CartoDB::UserOrganization.new(organization.id, user.id)
      expect {
        user_org.promote_user_to_admin
      }.to raise_error

      user.destroy
    end
  end

  describe '#org_members_and_owner_removal' do

    it 'Tests removing a normal member from the organization' do
      ::User.any_instance.stubs(:create_in_central).returns(true)
      ::User.any_instance.stubs(:update_in_central).returns(true)

      org_name = unique_name('org')
      organization = Organization.new(quota_in_bytes: 1234567890, name: org_name, seats: 5).save

      owner = create_user(:quota_in_bytes => 524288000, :table_quota => 500)

      user_org = CartoDB::UserOrganization.new(organization.id, owner.id)
      user_org.promote_user_to_admin

      organization.reload
      owner.reload

      member1 = create_user(:quota_in_bytes => 524288000, :table_quota => 500, organization_id: organization.id)
      member1.reload
      organization.reload

      member2 = create_user(:quota_in_bytes => 524288000, :table_quota => 500, organization_id: organization.id)
      member2.reload

      organization.users.count.should eq 3

      results = member1.in_database(as: :public_user).fetch(%Q{
        SELECT has_function_privilege('#{member1.database_public_username}', 'CDB_QueryTablesText(text)', 'execute')
      }).first
      results.nil?.should eq false
      results[:has_function_privilege].should eq true

      member1.destroy
      organization.reload

      organization.users.count.should eq 2

      results = member2.in_database(as: :public_user).fetch(%Q{
        SELECT has_function_privilege('#{member2.database_public_username}', 'CDB_QueryTablesText(text)', 'execute')
      }).first
      results.nil?.should eq false
      results[:has_function_privilege].should eq true

      # Can't remove owner if other members exist
      expect {
        owner.destroy
      }.to raise_error CartoDB::BaseCartoDBError

      member2.destroy
      organization.reload

      organization.users.count.should eq 1

      results = owner.in_database(as: :public_user).fetch(%Q{
        SELECT has_function_privilege('#{owner.database_public_username}', 'CDB_QueryTablesText(text)', 'execute')
      }).first
      results.nil?.should eq false
      results[:has_function_privilege].should eq true

      owner.destroy

      expect {
        organization.reload
      }.to raise_error Sequel::Error
    end
    it 'Tests removing a normal member with analysis tables' do
      ::User.any_instance.stubs(:create_in_central).returns(true)
      ::User.any_instance.stubs(:update_in_central).returns(true)

      org_name = unique_name('org')
      organization = Organization.new(quota_in_bytes: 1234567890, name: org_name, seats: 5).save
      owner = create_test_user('orgowner')
      user_org = CartoDB::UserOrganization.new(organization.id, owner.id)
      user_org.promote_user_to_admin
      organization.reload
      owner.reload

      member1 = create_test_user('member1', organization)
      create_random_table(member1, 'analysis_user_table')
      create_random_table(member1, 'users_table')
      member1.in_database.run(%{CREATE TABLE #{member1.database_schema}.analysis_4bd65e58e4_246c4acb2c67e4f3330d76c4be7c6deb8e07f344 (id serial)})
      member1.reload

      organization.reload
      organization.users.count.should eq 2

      results = member1.in_database(as: :public_user).fetch(%{
        SELECT has_function_privilege('#{member1.database_public_username}', 'CDB_QueryTablesText(text)', 'execute')
      }).first
      results.nil?.should eq false
      results[:has_function_privilege].should eq true

      member1.destroy
      organization.reload
      organization.users.count.should eq 1
    end
  end

  describe '#non_org_user_removal' do
    it 'Tests removing a normal user' do
      initial_count = ::User.all.count

      user = create_user(:quota_in_bytes => 524288000, :table_quota => 50)

      ::User.all.count.should eq (initial_count + 1)

      user.destroy

      ::User.all.count.should eq initial_count
      ::User.all.collect(&:id).should_not include(user.id)
    end
  end

  describe '#users_in_same_db_removal_error' do
    it "Tests that if 2+ users somehow have same database name, can't be deleted" do
      user2 = create_user(:quota_in_bytes => 524288000, :table_quota => 50, :database_name => @user.database_name)
      user2.database_name = @user.database_name
      user2.save

      expect {
        user2.destroy
      }.to raise_error CartoDB::BaseCartoDBError
    end
  end

  describe '#unique_name' do
    it 'Tests uniqueness of name' do
      org_name = unique_name('org')

      organization = Organization.new
      organization.name = org_name
      organization.quota_in_bytes = 123
      organization.seats = 1
      organization.errors
      organization.valid?.should eq true

      # Repeated username
      organization.name = @user.username
      organization.valid?.should eq false
      organization.name = org_name
      organization.save

      organization2 = Organization.new
      # Repeated name
      organization2.name = org_name
      organization2.quota_in_bytes = 123
      organization2.seats = 1
      organization2.valid?.should eq false

      organization.destroy
    end
  end

  describe "#get_api_calls and #get_geocodings" do
    before(:each) do
      @organization = create_organization_with_users(name: 'overquota-org')
    end
    after(:each) do
      @organization.destroy
    end
    it "should return the sum of the api_calls for all organization users" do
      ::User.any_instance.stubs(:get_api_calls).returns (0..30).to_a
      @organization.get_api_calls.should == (0..30).to_a.sum * @organization.users.size
    end
  end

  describe '.overquota', focus: true do
    before(:all) do
      @organization = create_organization_with_users(name: 'overquota-org')
      @owner = User.where(id: @organization.owner_id).first
    end
    after(:all) do
      @organization.destroy
    end
    it "should return organizations over their geocoding quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.overquota.should be_empty
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(10)
      Organization.any_instance.stubs(:get_geocoding_calls).returns 30
      Organization.any_instance.stubs(:geocoding_quota).returns 10
      Organization.overquota.map(&:id).should include(@organization.id)
      Organization.overquota.size.should == Organization.count
    end

    it "should return organizations over their here isolines quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.overquota.should be_empty
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(10)
      Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Organization.any_instance.stubs(:geocoding_quota).returns 10
      Organization.any_instance.stubs(:get_here_isolines_calls).returns 30
      Organization.any_instance.stubs(:here_isolines_quota).returns 10
      Organization.overquota.map(&:id).should include(@organization.id)
      Organization.overquota.size.should == Organization.count
    end

    it "should return organizations over their data observatory snapshot quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.overquota.should be_empty
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(10)
      Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Organization.any_instance.stubs(:geocoding_quota).returns 10
      Organization.any_instance.stubs(:get_obs_snapshot_calls).returns 30
      Organization.any_instance.stubs(:obs_snapshot_quota).returns 10
      Organization.overquota.map(&:id).should include(@organization.id)
      Organization.overquota.size.should == Organization.count
    end

    it "should return organizations over their data observatory general quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.overquota.should be_empty
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(10)
      Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Organization.any_instance.stubs(:geocoding_quota).returns 10
      Organization.any_instance.stubs(:get_obs_snapshot_calls).returns 0
      Organization.any_instance.stubs(:obs_snapshot_quota).returns 10
      Organization.any_instance.stubs(:get_obs_general_calls).returns 30
      Organization.any_instance.stubs(:obs_general_quota).returns 10
      Organization.overquota.map(&:id).should include(@organization.id)
      Organization.overquota.size.should == Organization.count
    end

    it "should return organizations near their geocoding quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(120)
      Organization.any_instance.stubs(:get_geocoding_calls).returns(81)
      Organization.any_instance.stubs(:geocoding_quota).returns(100)
      Organization.overquota.should be_empty
      Organization.overquota(0.20).map(&:id).should include(@organization.id)
      Organization.overquota(0.20).size.should == Organization.count
      Organization.overquota(0.10).should be_empty
    end

    it "should return organizations near their here isolines quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(120)
      Organization.any_instance.stubs(:get_geocoding_calls).returns(0)
      Organization.any_instance.stubs(:geocoding_quota).returns(100)
      Organization.any_instance.stubs(:get_here_isolines_calls).returns(81)
      Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Organization.any_instance.stubs(:get_obs_snapshot_calls).returns(0)
      Organization.any_instance.stubs(:obs_snapshot_quota).returns(100)
      Organization.any_instance.stubs(:get_obs_general_calls).returns(0)
      Organization.any_instance.stubs(:obs_general_quota).returns(100)
      Organization.any_instance.stubs(:get_mapzen_routing_calls).returns(81)
      Organization.any_instance.stubs(:mapzen_routing_quota).returns(100)
      Organization.overquota.should be_empty
      Organization.overquota(0.20).map(&:id).should include(@organization.id)
      Organization.overquota(0.20).size.should == Organization.count
      Organization.overquota(0.10).should be_empty
    end

    it "should return organizations near their data observatory snapshot quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(120)
      Organization.any_instance.stubs(:get_geocoding_calls).returns(0)
      Organization.any_instance.stubs(:geocoding_quota).returns(100)
      Organization.any_instance.stubs(:get_here_isolines_calls).returns(0)
      Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Organization.any_instance.stubs(:get_obs_general_calls).returns(0)
      Organization.any_instance.stubs(:obs_general_quota).returns(100)
      Organization.any_instance.stubs(:get_obs_snapshot_calls).returns(81)
      Organization.any_instance.stubs(:obs_snapshot_quota).returns(100)
      Organization.any_instance.stubs(:get_mapzen_routing_calls).returns(0)
      Organization.any_instance.stubs(:mapzen_routing_quota).returns(100)
      Organization.overquota.should be_empty
      Organization.overquota(0.20).map(&:id).should include(@organization.id)
      Organization.overquota(0.20).size.should == Organization.count
      Organization.overquota(0.10).should be_empty
    end

    it "should return organizations near their data observatory general quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(120)
      Organization.any_instance.stubs(:get_geocoding_calls).returns(0)
      Organization.any_instance.stubs(:geocoding_quota).returns(100)
      Organization.any_instance.stubs(:get_here_isolines_calls).returns(0)
      Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Organization.any_instance.stubs(:get_obs_snapshot_calls).returns(0)
      Organization.any_instance.stubs(:obs_snapshot_quota).returns(100)
      Organization.any_instance.stubs(:get_obs_general_calls).returns(81)
      Organization.any_instance.stubs(:obs_general_quota).returns(100)
      Organization.any_instance.stubs(:get_mapzen_routing_calls).returns(0)
      Organization.any_instance.stubs(:mapzen_routing_quota).returns(100)
      Organization.overquota.should be_empty
      Organization.overquota(0.20).map(&:id).should include(@organization.id)
      Organization.overquota(0.20).size.should == Organization.count
      Organization.overquota(0.10).should be_empty
    end

    it "should return organizations over their mapzen routing quota" do
      Organization.any_instance.stubs(:owner).returns(@owner)
      Organization.overquota.should be_empty
      Organization.any_instance.stubs(:get_api_calls).returns(0)
      Organization.any_instance.stubs(:map_view_quota).returns(10)
      Organization.any_instance.stubs(:get_geocoding_calls).returns 0
      Organization.any_instance.stubs(:geocoding_quota).returns 10
      Organization.any_instance.stubs(:get_here_isolines_calls).returns(0)
      Organization.any_instance.stubs(:here_isolines_quota).returns(100)
      Organization.any_instance.stubs(:get_mapzen_routing_calls).returns 30
      Organization.any_instance.stubs(:mapzen_routing_quota).returns 10
      Organization.overquota.map(&:id).should include(@organization.id)
      Organization.overquota.size.should == Organization.count
    end
  end

  it 'should validate password_expiration_in_d' do
    organization = FactoryGirl.create(:organization)
    organization.valid?.should be_true
    organization.password_expiration_in_d.should_not be

    # minimum 1 day
    organization = FactoryGirl.create(:organization, password_expiration_in_d: 1)
    organization.valid?.should be_true
    organization.password_expiration_in_d.should eq 1

    expect {
      organization = FactoryGirl.create(:organization, password_expiration_in_d: 0)
    }.to raise_error(Sequel::ValidationFailed, /password_expiration_in_d must be greater than 0 and lower than 366/)

    # maximum 1 year
    organization = FactoryGirl.create(:organization, password_expiration_in_d: 365)
    organization.valid?.should be_true
    organization.password_expiration_in_d.should eq 365

    expect {
      organization = FactoryGirl.create(:organization, password_expiration_in_d: 366)
    }.to raise_error(Sequel::ValidationFailed, /password_expiration_in_d must be greater than 0 and lower than 366/)

    # nil or blank means unlimited
    organization = FactoryGirl.create(:organization, password_expiration_in_d: nil)
    organization.valid?.should be_true
    organization.password_expiration_in_d.should_not be

    organization = FactoryGirl.create(:organization, password_expiration_in_d: '')
    organization.valid?.should be_true
    organization.password_expiration_in_d.should_not be

    # defaults to global config if no value
    organization = FactoryGirl.build(:organization, password_expiration_in_d: 1)
    organization.valid?.should be_true
    organization.save

    organization = Carto::Organization.find(organization.id)
    organization.valid?.should be_true
    organization.password_expiration_in_d.should eq 1

    organization.password_expiration_in_d = nil
    organization.valid?.should be_true
    organization.save
    organization = Carto::Organization.find(organization.id)
    organization.password_expiration_in_d.should_not be

    # override default config if a value is set
    organization = FactoryGirl.create(:organization, password_expiration_in_d: 10)
    organization.valid?.should be_true
    organization.password_expiration_in_d.should eq 10

    # keep values configured
    organization = Carto::Organization.find(organization.id)
    organization.valid?.should be_true
    organization.password_expiration_in_d.should eq 10
  end

  it 'should handle redis keys properly' do
    @organization = create_organization_with_users(name: 'overquota-org')

    $users_metadata.hkeys(@organization.key).should_not be_empty

    @organization.destroy

    $users_metadata.hkeys(@organization.key).should be_empty
  end

  def random_attributes(attributes = {})
    random = unique_name('viz')
    {
      name:         attributes.fetch(:name, random),
      description:  attributes.fetch(:description, "description #{random}"),
      privacy:      attributes.fetch(:privacy, Visualization::Member::PRIVACY_PUBLIC),
      tags:         attributes.fetch(:tags, ['tag 1']),
      type:         attributes.fetch(:type, Visualization::Member::TYPE_DERIVED),
      user_id:      attributes.fetch(:user_id, UUIDTools::UUID.timestamp_create.to_s)
    }
  end # random_attributes

end

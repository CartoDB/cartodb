require_relative '../spec_helper'

require_relative '../../app/models/visualization/collection'
require_relative '../../app/models/organization.rb'
require_relative 'organization_shared_examples'
require 'helpers/unique_names_helper'

include UniqueNamesHelper
include CartoDB

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
    stub_named_maps_calls
    begin
      @user.destroy
    rescue
      # Silence error, can't do much more
    end
  end

  describe '#destroy_cascade' do

    after(:each) do
      @organization.delete if @organization
    end

    it 'Destroys users and owner as well' do

      ::User.any_instance.stubs(:create_in_central).returns(true)
      ::User.any_instance.stubs(:update_in_central).returns(true)

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

    it 'destroys its groups through the extension' do
      Carto::Group.any_instance.expects(:destroy_group_with_extension).once
      @organization = FactoryGirl.create(:organization)
      group = FactoryGirl.create(:carto_group, organization: Carto::Organization.find(@organization.id))
      @organization.destroy
      @organization = nil
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
        SELECT has_function_privilege('#{member1.database_public_username}', 'cdb_querytables(text)', 'execute')
      }).first
      results.nil?.should eq false
      results[:has_function_privilege].should eq true

      member1.destroy
      organization.reload

      organization.users.count.should eq 2

      results = member2.in_database(as: :public_user).fetch(%Q{
        SELECT has_function_privilege('#{member2.database_public_username}', 'cdb_querytables(text)', 'execute')
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
        SELECT has_function_privilege('#{owner.database_public_username}', 'cdb_querytables(text)', 'execute')
      }).first
      results.nil?.should eq false
      results[:has_function_privilege].should eq true

      owner.destroy

      expect {
        organization.reload
      }.to raise_error Sequel::Error
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

  describe '#org_shared_vis' do
    it "checks fetching all shared visualizations of an organization's members " do
      CartoDB::NamedMapsWrapper::NamedMaps.any_instance.stubs(:get => nil, :create => true, :update => true)

      # Don't check/handle DB permissions
      Permission.any_instance.stubs(:revoke_previous_permissions).returns(nil)
      Permission.any_instance.stubs(:grant_db_permission).returns(nil)

      vis_1_name = 'viz_1'
      vis_2_name = 'viz_2'
      vis_3_name = 'viz_3'

      user1 = create_user(:quota_in_bytes => 1234567890, :table_quota => 5)
      user2 = create_user(:quota_in_bytes => 1234567890, :table_quota => 5)
      user3 = create_user(:quota_in_bytes => 1234567890, :table_quota => 5)

      organization = Organization.new
      organization.name = 'qwerty'
      organization.seats = 5
      organization.quota_in_bytes = 1234567890
      organization.save.reload
      user1.organization_id = organization.id
      user1.save.reload
      organization.owner_id = user1.id
      organization.save.reload
      user2.organization_id = organization.id
      user2.save.reload
      user3.organization_id = organization.id
      user3.save.reload

      vis1 = Visualization::Member.new(random_attributes(name: vis_1_name, user_id: user1.id)).store
      vis2 = Visualization::Member.new(random_attributes(name: vis_2_name, user_id: user2.id)).store
      vis3 = Visualization::Member.new(random_attributes(name: vis_3_name, user_id: user3.id)).store

      perm = vis1.permission
      perm.acl = [
          {
              type: Permission::TYPE_ORGANIZATION,
              entity: {
                  id:       organization.id,
                  username: organization.name
              },
              access: Permission::ACCESS_READONLY
          }
      ]
      perm.save

      perm = vis2.permission
      perm.acl = [
          {
              type: Permission::TYPE_ORGANIZATION,
              entity: {
                  id:       organization.id,
                  username: organization.name
              },
              access: Permission::ACCESS_READONLY
          }
      ]
      perm.save

      perm = vis3.permission
      perm.acl = [
          {
              type: Permission::TYPE_ORGANIZATION,
              entity: {
                  id:       organization.id,
                  username: organization.name
              },
              access: Permission::ACCESS_READONLY
          }
      ]
      perm.save

      # Setup done, now to the proper test

      org_vis_array = organization.public_visualizations.map { |vis|
        vis.id
      }
      # Order is newest to oldest
      org_vis_array.should eq [vis3.id, vis2.id, vis1.id]

      # Clear first shared entities to be able to destroy
      vis1.permission.acl = []
      vis1.permission.save
      vis2.permission.acl = []
      vis2.permission.save
      vis3.permission.acl = []
      vis3.permission.save

      begin
        user3.destroy
        user2.destroy
        user1.destroy
      rescue
        # TODO: Finish deletion of organization users and remove this so users are properly deleted or test fails
      end
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
      Organization.overquota.should be_empty
      Organization.overquota(0.20).map(&:id).should include(@organization.id)
      Organization.overquota(0.20).size.should == Organization.count
      Organization.overquota(0.10).should be_empty
    end
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

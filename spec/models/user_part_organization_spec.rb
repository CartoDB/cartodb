require_relative '../spec_helper'
require 'helpers/user_part_helper'

describe User do
  include UserPartHelper
  include_context 'user spec configuration'

  describe 'organization checks' do
    it "should not be valid if their organization doesn't have more seats" do
      organization = create_org('testorg', 10.megabytes, 1)
      user1 = create_user email: 'user1@testorg.com',
                          username: 'user1',
                          password: 'user11',
                          account_type: 'ORGANIZATION USER'
      user1.organization = organization
      user1.save
      organization.owner_id = user1.id
      organization.save
      organization.reload
      user1.reload

      user2 = new_user
      user2.organization = organization
      user2.valid?.should be_false
      user2.errors.keys.should include(:organization)

      organization.destroy
      user1.destroy
    end

    it 'should be valid if their organization has enough seats' do
      organization = create_org('testorg', 10.megabytes, 1)
      user = ::User.new
      user.organization = organization
      user.valid?
      user.errors.keys.should_not include(:organization)
      organization.destroy
    end

    it "should not be valid if their organization doesn't have enough disk space" do
      organization = create_org('testorg', 10.megabytes, 1)
      user = build(:valid_user, quota_in_bytes: 100.megabytes, organization_id: organization.id)

      expect(user).not_to be_valid
      expect(user.errors.keys).to include(:quota_in_bytes)
    end

    it 'should be valid if their organization has enough disk space' do
      organization = create_org('testorg', 10.megabytes, 1)
      organization.stubs(:assigned_quota).returns(9.megabytes)
      user = ::User.new
      user.organization = organization
      user.quota_in_bytes = 1.megabyte
      user.valid?
      user.errors.keys.should_not include(:quota_in_bytes)
      organization.destroy
    end

    describe '#org_admin' do
      before(:all) do
        @organization = create_organization_with_owner
      end

      after(:all) do
        @organization.destroy
      end

      def create_role(user)
        # NOTE: It's hard to test the real Groups API call here, it needs a Rails server up and running
        # Instead, we test the main step that this function does internally (creating a role)
        user.in_database["CREATE ROLE \"#{user.database_username}_#{unique_name('role')}\""].all
      end

      it 'cannot be owner and viewer at the same time' do
        owner = @organization.owner.sequel_user

        owner.viewer = true
        expect(owner).not_to be_valid
        expect(owner.errors.keys).to include(:viewer)
      end

      it 'cannot be admin and viewer at the same time' do
        user = ::User.new
        user.organization = @organization
        user.viewer = true
        user.org_admin = true
        user.should_not be_valid
        user.errors.keys.should include(:viewer)
      end

      it 'should not be able to create groups without admin rights' do
        user = create(:valid_user, organization: @organization)
        expect { create_role(user) }.to raise_error
      end

      it 'should be able to create groups with admin rights' do
        user = create(:valid_user, organization: @organization, org_admin: true)
        expect { create_role(user) }.to_not raise_error
      end

      it 'should revoke admin rights on demotion' do
        user = create(:valid_user, organization: @organization, org_admin: true)
        expect { create_role(user) }.to_not raise_error

        user.org_admin = false
        user.save

        expect { create_role(user) }.to raise_error
      end
    end

    describe 'organization email whitelisting' do
      let(:organization) { create_org('testorg', 10.megabytes, 1) }

      it 'valid_user is valid' do
        user = build(:valid_user)

        expect(user).to be_valid
      end

      it 'user email is valid if organization has not whitelisted domains' do
        user = build(:valid_user, organization: organization)

        expect(user).to be_valid
      end

      it 'user email is not valid if organization has whitelisted domains and email is not under that domain' do
        organization.update!(whitelisted_email_domains: ['organization.org'])
        user = build(:valid_user, organization: organization).sequel_user

        expect(user).not_to be_valid
        expect(user.errors[:email]).to be_present
      end

      it 'user email is valid if organization has whitelisted domains and email is under that domain' do
        user = build(:valid_user, organization: organization)
        organization.whitelisted_email_domains = [user.email.split('@')[1]]

        expect(user).to be_valid
        expect(user.errors[:email]).to be_empty
      end
    end

    describe 'when updating user quota' do
      let(:organization) { create_organization_with_users(quota_in_bytes: 70.megabytes) }
      let(:user) { organization.owner.sequel_user }

      it 'should be valid if their organization has enough disk space' do
        user.quota_in_bytes = 1.megabyte

        expect(user).to be_valid
      end
      it "should not be valid if their organization doesn't have enough disk space" do
        user.quota_in_bytes = 71.megabytes

        expect(user).not_to be_valid
        expect(user.errors.keys).to include(:quota_in_bytes)
      end
    end

    describe 'when updating viewer state' do
      let(:organization) { create_organization_with_users(quota_in_bytes: 70.megabytes) }
      let(:user) { organization.users.find { |u| !u.organization_owner? } }
      let(:sequel_user) { user.sequel_user }

      before { organization.update!(viewer_seats: 10, seats: 10) }

      it 'should not allow changing to viewer without seats' do
        organization.update!(viewer_seats: 0)
        sequel_user.viewer = true

        expect(sequel_user).not_to be_valid
        expect(sequel_user.errors.keys).to include(:organization)
      end

      it 'should allow changing to viewer with enough seats' do
        sequel_user.viewer = true

        expect(sequel_user).to be_valid
      end

      it 'should not allow changing to builder without seats' do
        user.update!(viewer: true)
        organization.update!(seats: 1)
        sequel_user.viewer = false

        expect(sequel_user).not_to be_valid
        expect(sequel_user.errors.keys).to include(:organization)
      end

      it 'should allow changing to builder with seats' do
        user.update!(viewer: true)
        sequel_user.viewer = false

        expect(sequel_user).to be_valid
      end
    end

    it 'should set account_type properly' do
      organization = create_organization_with_users
      organization.users.reject(&:organization_owner?).each do |u|
        u.account_type.should == "ORGANIZATION USER"
      end
      organization.destroy
    end

    it 'should set default settings properly unless overriden' do
      organization = create_organization_with_users
      organization.users.reject(&:organization_owner?).each do |u|
        u.max_layers.should eq ::User::DEFAULT_MAX_LAYERS
        u.private_tables_enabled.should be_true
        u.sync_tables_enabled.should be_true
      end
      user = build(:user, organization: organization)
      user.max_layers = 3
      user.save
      user.max_layers.should == 3
      organization.destroy
    end

    describe 'google_maps_key and google_maps_private_key' do
      before(:all) do
        @organization = create_organization_with_users(google_maps_key: 'gmk', google_maps_private_key: 'gmpk')
        @organization.google_maps_key.should_not be_nil
        @organization.google_maps_private_key.should_not be_nil
      end

      after(:all) do
        @organization.destroy
      end

      it 'should be inherited from organization for new users' do
        @organization.users.should_not be_empty
        @organization.users.reject(&:organization_owner?).each do |u|
          u.google_maps_key.should == @organization.google_maps_key
          u.google_maps_private_key.should == @organization.google_maps_private_key
        end
      end
    end

    it 'should inherit twitter_datasource_enabled from organizations with custom config on creation' do
      organization = create_organization_with_users(twitter_datasource_enabled: true)
      organization.save
      organization.twitter_datasource_enabled.should be_true
      organization.users.reject(&:organization_owner?).each do |u|
        CartoDB::Datasources::DatasourcesFactory.stubs(:customized_config?).with(Search::Twitter::DATASOURCE_NAME, u).returns(true)
        u.twitter_datasource_enabled.should be_true
      end
      CartoDB::Datasources::DatasourcesFactory.stubs(:customized_config?).returns(true)
      user = create_user(organization: organization)
      user.save
      CartoDB::Datasources::DatasourcesFactory.stubs(:customized_config?).with(Search::Twitter::DATASOURCE_NAME, user).returns(true)
      user.twitter_datasource_enabled.should be_true
      organization.destroy
    end

    it "should return proper values for non-persisted settings" do
      organization = create_organization_with_users
      organization.users.reject(&:organization_owner?).each do |u|
        u.private_maps_enabled.should be_true
      end
      organization.destroy
    end
  end

  describe "organization user deletion" do

    it "should transfer tweet imports to owner" do

      # avoid: Key (account_type)=(ORGANIZATION USER) is not present in table "account_types"
      org = create_organization_with_users
      org.destroy

      u1 = create_user(email: 'u1@exampleb.com', username: 'ub1', password: 'admin123')
      org = create_org('cartodbtestb', 1234567890, 5)

      u1.organization = org
      u1.save
      u1.reload
      org = u1.organization
      org.owner_id = u1.id
      org.save
      u1.reload

      u2 = create_user(email: 'u2@exampleb.com', username: 'ub2', password: 'admin123', organization: org)

      tweet_attributes = {
        user_id: u2.id,
        table_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        data_import_id: '96a86fb7-0270-4255-a327-15410c2d49d4',
        service_item_id: '555',
        state: Carto::SearchTweet::STATE_COMPLETE
      }

      st1 = Carto::SearchTweet.new(tweet_attributes.merge(retrieved_items: 5))
      st2 = Carto::SearchTweet.new(tweet_attributes.merge(retrieved_items: 10))

      st1.save
      st2.save

      u1.reload
      u2.reload

      u2.get_twitter_imports_count.should == st1.retrieved_items + st2.retrieved_items
      u1.get_twitter_imports_count.should == 0

      u2.destroy
      u1.reload
      u1.get_twitter_imports_count.should == st1.retrieved_items + st2.retrieved_items

      org.destroy
      st1.destroy
      st2.destroy
    end
  end

  describe '#destroy_restrictions' do
    it 'Checks some scenarios upon user destruction regarding organizations' do
      u1 = create_user(email: 'u1@example.com', username: 'u1', password: 'admin123')
      u2 = create_user(email: 'u2@example.com', username: 'u2', password: 'admin123')

      org = create_org('cartodb', 1234567890, 5)

      u1.organization = org
      u1.save
      u1.reload
      u1.organization.nil?.should eq false
      org = u1.organization
      org.owner_id = u1.id
      org.save
      u1.reload
      u1.organization.owner.id.should eq u1.id

      u2.organization = org
      u2.save
      u2.reload
      u2.organization.nil?.should eq false
      u2.reload

      # Cannot remove as more users depend on the org
      expect {
        u1.destroy
      }.to raise_exception CartoDB::BaseCartoDBError

      org.destroy
    end
  end
end

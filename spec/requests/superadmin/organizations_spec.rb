# encoding: utf-8
require_relative '../../acceptance_helper'

feature "Superadmin's organization API" do
  before(:all) do
    # Capybara.current_driver = :rack_test
    @organization1 = create_organization_with_users
    @organization2 = create_organization_with_users
    @org_atts = @organization1.values
  end

  scenario "Http auth is needed" do
    post_json superadmin_users_path, { :format => "json" } do |response|
      response.status.should == 401
    end
  end

  scenario "organization create fail" do
    pending "Exception handling isn' implemented yet"
  end

  scenario "organization create success" do
    @org_atts = FactoryGirl.build(:organization).values
    post_json superadmin_organizations_path, { organization: @org_atts }, superadmin_headers do |response|
      response.status.should == 201
      response.body[:name].should == @org_atts[:name]

      # Double check that the organization has been created properly
      organization = Organization.filter(:name => @org_atts[:name]).first
      organization.should be_present
      organization.id.should == response.body[:id]
      organization.destroy
    end
  end

  scenario "organization with owner creation success" do
    org_atts = FactoryGirl.build(:organization).values
    user = FactoryGirl.create(:user_with_private_tables)
    org_atts[:owner_id] = user.id

    post_json superadmin_organizations_path, { organization: org_atts }, superadmin_headers do |response|
      response.status.should == 201
      response.body[:name].should == org_atts[:name]

      # Double check that the organization has been created properly
      organization = Organization.filter(name: org_atts[:name]).first
      organization.should be_present
      organization.id.should == response.body[:id]

      organization.owner_id.should == user.id
      user.reload
      user.organization_id.should == organization.id
      organization.destroy_cascade
    end
  end

  scenario "organization with owner creation failure" do
    org_atts = FactoryGirl.build(:organization).values
    user = FactoryGirl.create(:user_with_private_tables)
    org_atts[:owner_id] = user.id

    simulated_error = StandardError.new('promote_user_to_admin failure simulation')
    CartoDB::UserOrganization.any_instance.stubs(:promote_user_to_admin).raises(simulated_error)

    post_json superadmin_organizations_path, { organization: org_atts }, superadmin_headers do |response|
      response.status.should == 500

      Organization.filter(name: org_atts[:name]).first.should be_nil
      user.reload
      user.organization_id.should be_nil
    end
  end

  scenario "organization update fail" do
    pending "Exception handling isn' implemented yet"
  end

  scenario "organization update success" do
    put_json superadmin_organization_path(@organization1), { :organization => { :display_name => "Update Test", :map_view_quota => 800000 } }, superadmin_headers do |response|
      response.status.should == 204
    end
    organization = Organization[@organization1.id]
    organization.display_name.should == "Update Test"
    organization.map_view_quota.should == 800000
  end

  describe "organization delete success" do
    include_context 'organization with users helper'
    include TableSharing

    after(:all) do
      @organization_2.destroy
    end

    it 'destroys organizations (even with shared entities)' do
      table = create_random_table(@org_user_1)
      share_table_with_user(table, @org_user_2)

      delete_json superadmin_organization_path(@organization), {}, superadmin_headers do |response|
        response.status.should eq 204
      end
      Organization[@organization.id].should be_nil
    end
  end

  scenario "organization get info success" do
    get_json superadmin_organization_path(@organization1), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == @organization1.id
    end
  end

  describe "GET /superadmin/organization" do

    it "gets all organizations" do
      Organization.where(owner_id: nil).each(&:delete)
      get_json superadmin_organizations_path, {}, superadmin_headers do |response|
        response.status.should == 200
        response.body.map { |u| u["name"] }.should include(@organization1.name, @organization2.name)
        response.body.length.should >= 2
      end
    end
    it "gets overquota organizations" do
      Organization.stubs(:overquota).returns [@organization1]
      get_json superadmin_organizations_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]["name"].should == @organization1.name
        response.body.length.should == 1
      end
    end
    it "returns geocoding and mapviews quotas and uses for all organizations" do
      Organization.stubs(:overquota).returns [@organization1]
      ::User.any_instance.stubs(:get_geocoding_calls).returns(100)
      ::User.any_instance.stubs(:get_api_calls).returns (0..30).to_a
      get_json superadmin_organizations_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]["name"].should == @organization1.name
        response.body[0]["geocoding"]['quota'].should == @organization1.geocoding_quota
        response.body[0]["geocoding"]['monthly_use'].should == @organization1.get_geocoding_calls
        response.body[0]["api_calls_quota"].should == @organization1.map_view_quota
        response.body[0]["api_calls"].should == @organization1.get_api_calls
        response.body.length.should == 1
      end
    end
  end

  describe 'users destruction logic' do
    include_context 'organization with users helper'

    it 'blocks deletion of a user with shared entities' do
      table = create_random_table(@org_user_1)
      share_table(table, @org_user_1, @org_user_2)

      delete_json superadmin_user_path(@org_user_1), {}, superadmin_headers do |response|
        response.status.should eq 422
        response.body[:error].should eq 'Error destroying user: Cannot delete user, has shared entities'
      end
      ::User[@org_user_1.id].should be
      ::UserTable[table.id].should be
    end
  end

  describe 'sharing users destruction logic' do
    include_context 'organization with users helper'

    it 'keeps a table shared with an user when that user is deleted' do
      table = create_random_table(@org_user_1)
      share_table(table, @org_user_1, @org_user_2)
      @org_user_2.destroy

      Carto::UserTable.where(id: table.id).first.should_not be_nil

      expect {
        @org_user_1.destroy
      }.not_to raise_error(CartoDB::BaseCartoDBError, "Cannot delete user, has shared entities")
    end
  end

  describe 'users with shares destruction logic' do
    include_context 'organization with users helper'

    it 'cleans sharing information when recipient user is deleted' do
      table = create_random_table(@org_user_1)
      share_table(table, @org_user_1, @org_user_2)

      Carto::SharedEntity.where(recipient_id: @org_user_2.id).count.should == 1

      permission = table.map.visualization.permission
      permission.reload
      acl = JSON.parse(permission.access_control_list)
      acl[0]['id'].should == @org_user_2.id

      @org_user_2.destroy

      # Table is kept
      Carto::UserTable.where(id: table.id).first.should_not be_nil

      # Share is removed
      Carto::SharedEntity.where(recipient_id: @org_user_2.id).count.should == 0

      # User is removed from ACL
      table.reload
      permission = table.map.visualization.permission
      acl = JSON.parse(permission.access_control_list)
      acl.count.should == 0

      expect {
        @org_user_1.destroy
      }.not_to raise_error(CartoDB::BaseCartoDBError, "Cannot delete user, has shared entities")
    end
  end

  private

  def superadmin_headers(user = Cartodb.config[:superadmin]["username"], password = Cartodb.config[:superadmin]["password"])
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(user, password),
      'HTTP_ACCEPT' => "application/json"
    }
  end
end

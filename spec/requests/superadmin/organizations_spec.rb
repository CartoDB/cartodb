# encoding: utf-8
require_relative '../../acceptance_helper'

feature "Superadmin's organization API" do
  before(:all) do
    # Capybara.current_driver = :rack_test
    @organization = create_organization_with_users(name: 'vizzuality')
    @org_atts = @organization.values
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
    @org_atts = FactoryGirl.build(:organization, name: 'wadus').values
    post_json superadmin_organizations_path, { :organization => @org_atts }, superadmin_headers do |response|
      response.status.should == 201
      response.body[:name].should == 'wadus'

      # Double check that the organization has been created properly
      organization = Organization.filter(:name => @org_atts[:name]).first
      organization.should be_present
      organization.id.should == response.body[:id]
      organization.destroy
    end
  end

  scenario "organization update fail" do
    pending "Exception handling isn' implemented yet"
  end

  scenario "organization update success" do
    put_json superadmin_organization_path(@organization), { :organization => { :display_name => "Update Test", :map_view_quota => 800000 } }, superadmin_headers do |response|
      response.status.should == 204
    end
    organization = Organization[@organization.id]
    organization.display_name.should == "Update Test"
    organization.map_view_quota.should == 800000
  end

  scenario "organization delete success" do
    pending "Delete is not implemented yet"
  end

  scenario "organization get info success" do
    get_json superadmin_organization_path(@organization), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == @organization.id
    end
  end

  describe "GET /superadmin/organization" do
    it "gets all organizations" do
      @organization2 = FactoryGirl.create(:organization, name: 'wadus')
      get_json superadmin_organizations_path, {}, superadmin_headers do |response|
        response.status.should == 200
        response.body.map { |u| u["name"] }.should include(@organization.name, @organization2.name)
        response.body.length.should >= 2
      end
    end
    it "gets overquota organizations" do
      Organization.stubs(:overquota).returns [@organization]
      get_json superadmin_organizations_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]["name"].should == @organization.name
        response.body.length.should == 1
      end
    end
    it "returns geocoding and mapviews quotas and uses for all organizations" do
      Organization.stubs(:overquota).returns [@organization]
      User.any_instance.stubs(:get_geocoding_calls).returns(100)
      User.any_instance.stubs(:get_api_calls).returns (0..30).to_a
      get_json superadmin_organizations_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]["name"].should == @organization.name
        response.body[0]["geocoding"]['quota'].should == @organization.geocoding_quota
        response.body[0]["geocoding"]['monthly_use'].should == @organization.get_geocoding_calls
        response.body[0]["api_calls_quota"].should == @organization.map_view_quota
        response.body[0]["api_calls"].should == @organization.get_api_calls
        response.body.length.should == 1
      end
    end
  end

  describe 'users destruction logic' do
    include_context 'organization with users helper'

    it 'keeps a table shared with an user when that user is deleted' do
      table = create_random_table(@org_user_1)
      share_table(table, @org_user_1, @org_user_2)
      @org_user_2.destroy

      Carto::UserTable.where(id: table.id).first.should_not be_nil

      expect {
        @org_user_1.destroy
      }.to raise_error(CartoDB::BaseCartoDBError, "Cannot delete user, has shared entities")
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

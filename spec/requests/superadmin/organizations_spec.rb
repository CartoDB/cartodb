# rubocop:disable RSpec/InstanceVariable

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

  scenario "organization get info success" do
    get_json superadmin_organization_path(@organization1), {}, superadmin_headers do |response|
      response.status.should == 200
      response.body[:id].should == @organization1.id
    end
  end

  describe "GET /superadmin/organization" do

    it "gets all organizations" do
      Carto::Organization.where(owner_id: nil).destroy_all
      get_json superadmin_organizations_path, {}, superadmin_headers do |response|
        response.status.should == 200
        response.body.map { |u| u["name"] }.should include(@organization1.name, @organization2.name)
        response.body.length.should >= 2
      end
    end
    it "gets overquota organizations" do
      Carto::Organization.stubs(:overquota).returns [@organization1]
      get_json superadmin_organizations_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]["name"].should == @organization1.name
        response.body.length.should == 1
      end
    end
    # rubocop:disable Lint/Void

    it "returns geocoding and mapviews quotas and uses for all organizations" do
      Carto::Organization.stubs(:overquota).returns [@organization1]
      ::User.any_instance.stubs(:get_geocoding_calls).returns(100)
      ::User.any_instance.stubs(:map_views_count).returns (0..30).to_a
      get_json superadmin_organizations_path, { overquota: true }, superadmin_headers do |response|
        response.status.should == 200
        response.body[0]['name'].should == @organization1.name
        response.body[0]['geocoding']['quota'].should == @organization1.geocoding_quota
        response.body[0]['geocoding']['monthly_use'].should == @organization1.get_geocoding_calls
        response.body[0]['map_views_quota'].should == @organization1.map_views_quota
        response.body[0]['map_views'].should == @organization1.map_views_count
        response.body.length.should == 1
      end
    end
    # rubocop:enable Lint/Void
  end

  private

  def superadmin_headers(user = Cartodb.config[:superadmin]["username"], password = Cartodb.config[:superadmin]["password"])
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(user, password),
      'HTTP_ACCEPT' => "application/json"
    }
  end
end
# rubocop:enable RSpec/InstanceVariable

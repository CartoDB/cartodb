# encoding: utf-8
require_relative '../../acceptance_helper'
require 'ruby-debug'

feature "Superadmin's organization API" do
  before(:all) do
    # Capybara.current_driver = :rack_test
    @organization = FactoryGirl.create(:organization_with_users, name: 'vizzuality')
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
    post_json superadmin_organizations_path, { :organization => @org_atts }, default_headers do |response|
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
    put_json superadmin_organization_path(@organization), { :organization => { :display_name => "Update Test", :map_view_quota => 800000 } }, default_headers do |response|
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
    get_json superadmin_organization_path(@organization), {}, default_headers do |response|
      response.status.should == 200
      response.body[:id].should == @organization.id
    end
  end

  describe "GET /superadmin/organization" do
    it "gets all organizations" do
      @organization2 = FactoryGirl.create(:organization, name: 'wadus')
      get_json superadmin_organizations_path, {}, default_headers do |response|
        response.status.should == 200
        response.body.map { |u| u["name"] }.should include(@organization.name, @organization2.name)
        response.body.length.should >= 2
      end
    end
  end

  private

  def default_headers(user = Cartodb.config[:superadmin]["username"], password = Cartodb.config[:superadmin]["password"])
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(user, password),
      'HTTP_ACCEPT' => "application/json"
    }
  end
end

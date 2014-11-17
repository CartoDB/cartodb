require 'spec_helper'
require_relative '../../lib/cartodb/central'
describe Cartodb::Central do

  before(:all) do
    @organization = create_organization_with_users(name: 'test-org')
    @user = @organization.users.first
    @user.username = 'user1'
    @user.save
    @cartodb_central_client = Cartodb::Central.new
    @org_path = "/api/organizations/#{ @organization.name }"
    @users_path = "#{ @org_path }/users"
    @user_path = "#{ @users_path }/#{ @user.username }"
  end

  after(:all) do
    @user.destroy
  end

  describe "Central synchronization client" do
    describe "Organization users" do
      it "gets all users from an organization" do
        request = @cartodb_central_client.build_request(@users_path, nil, :get)
      end

      it "gets an organization user" do
        request = @cartodb_central_client.build_request(@user_path, nil, :get)
      end

      it "creates an organization user" do
        body = { user: @user.allowed_attributes_to_central(:create) }

        request = @cartodb_central_client.build_request(@user_path, body, :post)

        request.url.should == "#{ @cartodb_central_client.host }/#{ @user_path }"
        request.options[:headers]["Content-Type"].should == "application/json"
        request.options[:method].should == :post
        request.options[:body].should == { user: @user.allowed_attributes_to_central(:create) }.to_json
      end

      it "updates an organization user" do
        body = { user: @user.allowed_attributes_to_central(:update) }

        request = @cartodb_central_client.build_request(@user_path, body, :put)

        request.url.should == "#{ @cartodb_central_client.host }/#{ @user_path }"
        request.options[:headers]["Content-Type"].should == "application/json"
        request.options[:method].should == :put
        request.options[:body].should == { user: @user.allowed_attributes_to_central(:update) }.to_json
      end

      it "deletes an organization user" do
        request = @cartodb_central_client.build_request(@user_path, nil, :delete)

        request.url.should == "#{ @cartodb_central_client.host }/#{ @user_path }"
        request.options[:headers]["Content-Type"].should == "application/json"
        request.options[:method].should == :delete
      end
    end

    describe "Organizations" do
      it "updates an organization" do
        body = { organization: @organization.allowed_attributes_to_central(:update) }

        request = @cartodb_central_client.build_request(@org_path, body, :put)

        request.url.should == "#{ @cartodb_central_client.host }/#{ @org_path }"
        request.options[:headers]["Content-Type"].should == "application/json"
        request.options[:method].should == :put
        request.options[:body].should == { organization: @organization.allowed_attributes_to_central(:update) }.to_json
      end
    end

  end

end

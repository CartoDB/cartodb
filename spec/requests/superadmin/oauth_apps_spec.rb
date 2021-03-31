require_relative '../../acceptance_helper'

describe Superadmin::OauthAppsController do

  before(:all) do
    @user = create(:carto_user)
  end

  after(:all) do
    @user.destroy!
  end

  describe '#create' do
    before(:each) do
      @oauth_app = build(:oauth_app, user_id: @user.id)
      @oauth_app_param = {
        oauth_app: @oauth_app.api_attributes
      }
    end

    after(:each) do
      @oauth_app.destroy!
    end

    it 'should create an oauth_app' do
      expect {
        post superadmin_oauth_apps_url, @oauth_app_param.to_json, superadmin_headers

        response.status.should == 201
      }.to change(Carto::OauthApp, :count).by(1)
    end

    it 'should create an oauth_app with nonexistent user' do
      Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
      expect {
        @oauth_app_param[:oauth_app][:user_id] = nil
        post superadmin_oauth_apps_url, @oauth_app_param.to_json, superadmin_headers

        response.status.should == 201
      }.to change(Carto::OauthApp, :count).by(1)
    end
  end

  describe '#update' do
    before(:each) do
      @oauth_app = create(:oauth_app, user_id: @user.id)
      @oauth_app.name = 'updated_name'
      @oauth_app_param = {
        oauth_app: @oauth_app.api_attributes
      }
    end

    after(:each) do
      @oauth_app.destroy!
    end

    it 'should update an oauth app' do
      expect {
        put superadmin_oauth_app_url(@oauth_app.id),
            @oauth_app_param.to_json,
            superadmin_headers

        response.status.should == 204
        @oauth_app.reload
        @oauth_app.name.should eq 'updated_name'
      }.to change(Carto::OauthApp, :count).by(0)
    end

    it 'should update an oauth_app with nonexistent user' do
      Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
      expect {
        @oauth_app_param[:oauth_app][:user_id] = nil
        put superadmin_oauth_app_url(@oauth_app.id),
            @oauth_app_param.to_json,
            superadmin_headers

        response.status.should == 204
        @oauth_app.reload
        @oauth_app.name.should eq 'updated_name'
        @oauth_app.user_id.should eq nil
      }.to change(Carto::OauthApp, :count).by(0)
    end

    it 'should raise an error if non-existent oauth_app' do
      put_json superadmin_oauth_app_url("non_existent"),
               @oauth_app_param.to_json,
               superadmin_headers do |response|

        response.status.should == 404
        response.body[:error].should =~ /ERROR. oauth_app not found/
      end
    end
  end

  describe '#destroy' do
    before(:each) do
      @oauth_app = create(:oauth_app, user_id: @user.id)
    end

    after(:each) do
      @oauth_app.destroy! if @oauth_app
    end

    it 'should destroy oauth_app' do
      expect {
        delete superadmin_oauth_app_url(@oauth_app.id), nil, superadmin_headers
        response.status.should == 204
      }.to change(Carto::OauthApp, :count).by(-1)

      expect {
        Carto::OauthApp.find(@oauth_app.id)
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    it 'should raise an error if non-existent oauth_app' do
      delete_json superadmin_oauth_app_url("non_existent"), nil, superadmin_headers do |response|

        response.status.should == 404
        response.body[:error].should =~ /ERROR. oauth_app not found/
      end
    end
  end
end

# encoding: utf-8

require_relative '../../../spec_helper_min'

describe Carto::Api::UsersController do
  include Warden::Test::Helpers

  before(:all) do
    @user = create_user
  end

  before(:each) do
    host! "#{@user.username}.localhost.lan"
    login_as(@user, scope: @user.username)
  end

  after(:all) do
    @user.destroy
  end

  describe '#google_maps_static_image' do
    let(:params) do
      {
        mapType: 'roadmap',
        size: '300x200',
        zoom: 14,
        center: '0.12,-7.56',
        style: []
      }
    end

    it 'returns error if user does not have Google configured' do
      @user.google_maps_key = nil
      @user.save
      post_json api_v1_google_maps_static_image_url(params) do |response|
        expect(response.status).to eq 400
        expect(response.body[:errors]).to be
      end
    end

    it 'returns signed google maps URL' do
      @user.google_maps_key = 'key=GAdhfasjkd'
      @user.save
      post_json api_v1_google_maps_static_image_url(params) do |response|
        response.status.should be_success
        response.body[:url].should eq 'https://maps.googleapis.com/maps/api/staticmap?center=0.12,-7.56&mapType=roadmap&size=300x200&zoom=14&key=GAdhfasjkd'
      end
    end
  end
end

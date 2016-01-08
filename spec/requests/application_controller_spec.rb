# encoding: utf-8

require_relative '../spec_helper'

describe ApplicationController do
  # This filter should always be invoked if http_header_authentication is set,
  # tests are based in dashboard requests because of genericity.
  describe '#http_header_authentication' do
    let(:authenticated_header) { 'auth_header' }

    def authentication_headers(value = $user_1.email)
      { "#{authenticated_header}" => value }
    end

    def stub_http_header_authentication_configuration(field = 'email')
      Cartodb.stubs(:get_config)
      Cartodb.expects(:get_config).
        with(:http_header_authentication, 'header').
        returns(authenticated_header).at_least_once
      Cartodb.stubs(:get_config).
        with(:http_header_authentication, 'field').
        returns(field)
    end

    def stub_load_common_data
      Admin::VisualizationsController.any_instance.stubs(:load_common_data).returns(true)
    end

    describe 'triggering' do
      it 'enabled if http_header_authentication is configured and header is sent' do
        stub_http_header_authentication_configuration
        ApplicationController.any_instance.expects(:http_header_authentication)
        get dashboard_url, {}, authentication_headers
      end

      it 'disabled if http_header_authentication is configured and header is not set' do
        stub_http_header_authentication_configuration
        ApplicationController.any_instance.expects(:http_header_authentication).never
        get dashboard_url, {}, {}
      end

      it 'disabled if http_header_authentication is not configured' do
        ApplicationController.any_instance.expects(:http_header_authentication).never
        get dashboard_url, {}, {}
        get dashboard_url, {}, authentication_headers
      end
    end

    describe 'email autentication' do
      it 'loads the dashboard for a known user email' do
        stub_load_common_data
        stub_http_header_authentication_configuration
        get dashboard_url, {}, authentication_headers($user_1.email)
        response.status.should == 200
        response.body.should_not include("Login to Carto")
      end

      it 'does not load the dashboard for an unknown user email' do
        stub_http_header_authentication_configuration
        get dashboard_url, {}, authentication_headers('wadus@wadus.com')
      end
    end

    describe 'username autentication configuration' do
      it 'loads the dashboard for a known user username' do
        stub_load_common_data
        stub_http_header_authentication_configuration('username')
        get dashboard_url, {}, authentication_headers($user_1.username)
        response.status.should == 200
        response.body.should_not include("Login to Carto")
      end

      it 'does not load the dashboard for an unknown user username' do
        stub_http_header_authentication_configuration('username')
        get dashboard_url, {}, authentication_headers("unknownuser")
      end
    end

    describe 'id autentication configuration' do
      it 'loads the dashboard for a known user id' do
        stub_load_common_data
        stub_http_header_authentication_configuration('id')
        get dashboard_url, {}, authentication_headers($user_1.id)
        response.status.should == 200
        response.body.should_not include("Login to Carto")
      end

      it 'does not load the dashboard for an unknown user id' do
        stub_http_header_authentication_configuration('id')
        get dashboard_url, {}, authentication_headers(UUIDTools::UUID.timestamp_create.to_s)
      end
    end

  end
end

# encoding: utf-8

require_relative '../spec_helper'

describe ApplicationController do
  # This filter should always be invoked if http_header_authentication is set,
  # tests are based in dashboard requests because of genericity.
  describe '#http_header_authentication' do
    let(:authenticated_header) { 'auth_header' }

    let(:authenticated_email_header) { { "#{authenticated_header}" => $user_1.email } }
    let(:wrong_authenticated_email_header) { { "#{authenticated_header}" => 'wadus@wadus.com' } }

    def stub_http_header_authentication_configuration
      Cartodb.stubs(:get_config)
      Cartodb.expects(:get_config).with(:http_header_authentication, 'header').returns(authenticated_header).at_least_once
    end

    def stub_load_common_data
      Admin::VisualizationsController.any_instance.stubs(:load_common_data).returns(true)
    end

    describe 'triggering' do
      it 'enabled if http_header_authentication is configured and header is sent' do
        stub_http_header_authentication_configuration
        ApplicationController.any_instance.expects(:http_header_authentication)
        get dashboard_url, {}, authenticated_email_header
      end

      it 'disabled if http_header_authentication is configured and header is not set' do
        stub_http_header_authentication_configuration
        ApplicationController.any_instance.expects(:http_header_authentication).never
        get dashboard_url, {}, {}
      end

      it 'disabled if http_header_authentication is not configured' do
        ApplicationController.any_instance.expects(:http_header_authentication).never
        get dashboard_url, {}, {}
        get dashboard_url, {}, authenticated_email_header
      end
    end

    describe 'email autentication' do
      it 'loads the dashboard for a known user email' do
        stub_load_common_data
        stub_http_header_authentication_configuration
        get dashboard_url, {}, authenticated_email_header
        response.status.should == 200
        response.body.should_not include("Login to Carto")
      end

      it 'does not load the dashboard for an unknown user email' do
        stub_http_header_authentication_configuration
        get dashboard_url, {}, wrong_authenticated_email_header
      end
    end

  end
end

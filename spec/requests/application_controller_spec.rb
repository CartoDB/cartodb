# encoding: utf-8

require_relative '../spec_helper'

describe ApplicationController do
  # This filter should always be invoked if http_header_authentication is set,
  # tests are based in dashboard requests because of genericity.
  describe '#http_header_authentication' do
    let(:authenticated_header) do
      'auth_header'
    end

    let(:authenticated_headers) do
      { "#{authenticated_header}" => $user_1.email }
    end

    let(:wrong_authenticated_headers) do
      { "#{authenticated_header}" => 'wadus@wadus.com' }
    end

    def stub_http_header_authentication_configuration
      Cartodb.stubs(:get_config)
      Cartodb.expects(:get_config).with(:http_header_authentication, 'header').returns(authenticated_header).at_least_once
    end

    def stub_load_common_data
      Admin::VisualizationsController.any_instance.stubs(:load_common_data).returns(true)
    end

    it 'is triggered if http_header_authentication is configured and header is sent' do
      stub_http_header_authentication_configuration
      ApplicationController.any_instance.expects(:http_header_authentication)
      get dashboard_url, {}, authenticated_headers
    end

    it 'is not triggered if http_header_authentication is configured and header is not set' do
      stub_http_header_authentication_configuration
      ApplicationController.any_instance.expects(:http_header_authentication).never
      get dashboard_url, {}, {}
    end

    it 'is not triggered if http_header_authentication is not configured' do
      ApplicationController.any_instance.expects(:http_header_authentication).never
      get dashboard_url, {}, {}
      get dashboard_url, {}, authenticated_headers
    end

    it 'loads the dashboard for a known user' do
      stub_load_common_data
      stub_http_header_authentication_configuration
      get dashboard_url, {}, authenticated_headers
      response.status.should == 200
      response.body.should_not include("Login to Carto")
    end

    it 'does not load the dashboard for an unknown user' do
      stub_http_header_authentication_configuration
      get dashboard_url, {}, wrong_authenticated_headers
    end
  end
end

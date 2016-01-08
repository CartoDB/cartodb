# encoding: utf-8

require 'ostruct'
require 'uuidtools'
require 'rspec/mocks'
require 'rspec/core'
require 'rspec/expectations'
require_relative '../../../lib/carto/http_header_authentication'

RSpec.configure do |config|
   config.mock_with :mocha
end

module Cartodb
  def self.get_config(*args)
  end
end

class User
end

describe Carto::HttpHeaderAuthentication do
  EMAIL = "user@cartodb.com"
  USERNAME = "user"
  ID = UUIDTools::UUID.timestamp_create.to_s

  let(:authenticated_header) { 'auth_header' }

  def stub_http_header_authentication_configuration(field = 'email', autocreation = false)
    Cartodb.stubs(:get_config)
    Cartodb.stubs(:get_config).
      with(:http_header_authentication, 'header').
      returns(authenticated_header)
    Cartodb.stubs(:get_config).
      with(:http_header_authentication, 'field').
      returns(field)
    Cartodb.stubs(:get_config).
      with(:http_header_authentication, 'autocreation').
      returns(autocreation)
  end

  let(:mock_unauthenticated_request) do
    OpenStruct.new(headers: {})
  end

  let(:mock_email_request) { OpenStruct.new(headers: { "#{authenticated_header}" => EMAIL } ) }
  let(:mock_username_request) { OpenStruct.new(headers: { "#{authenticated_header}" => USERNAME } ) }
  let(:mock_id_request) { OpenStruct.new(headers: { "#{authenticated_header}" => ID } ) }

  let(:mock_user) do
    OpenStruct.new(
      email: EMAIL
    )
  end

  let(:mock_user_search) { OpenStruct.new(first: mock_user) }

  describe '#valid?' do
    it 'returns false without configuration' do
      Carto::HttpHeaderAuthentication.new.valid?(mock_email_request).should == false
    end

    it 'returns false with configuration without header' do
      stub_http_header_authentication_configuration('email')
      Carto::HttpHeaderAuthentication.new.valid?(mock_unauthenticated_request).should == false
    end

    it 'returns true with configuration and header' do
      stub_http_header_authentication_configuration('email')
      Carto::HttpHeaderAuthentication.new.valid?(mock_email_request).should == true
    end
  end

  describe '#get_user?' do
    before(:each) do
      stub_http_header_authentication_configuration('email')
    end

    it 'returns nil without header' do
      Carto::HttpHeaderAuthentication.new.get_user(mock_unauthenticated_request).should be_nil
    end

    it 'searches by email with header' do
      User.expects(:where).with("email = ?", mock_email_request.headers[authenticated_header]).returns mock_user_search
      Carto::HttpHeaderAuthentication.new.get_user(mock_email_request).should == mock_user
    end

    describe 'auto field' do
      before(:each) do
        stub_http_header_authentication_configuration('auto')
      end

      it 'searches by field depending on header' do
        User.expects(:where).with("email = ?", mock_email_request.headers[authenticated_header]).once.returns mock_user_search
        Carto::HttpHeaderAuthentication.new.get_user(mock_email_request).should == mock_user

        User.expects(:where).with("username = ?", mock_username_request.headers[authenticated_header]).once.returns mock_user_search
        Carto::HttpHeaderAuthentication.new.get_user(mock_username_request).should == mock_user

        User.expects(:where).with("id = ?", mock_id_request.headers[authenticated_header]).once.returns mock_user_search
        Carto::HttpHeaderAuthentication.new.get_user(mock_id_request).should == mock_user
      end
    end
  end

  describe '#autocreation_enabled?' do
    it 'returns autocreation configuration' do
      stub_http_header_authentication_configuration('auto', true)
      Carto::HttpHeaderAuthentication.new.autocreation_enabled?.should be_true
      stub_http_header_authentication_configuration('auto', false)
      Carto::HttpHeaderAuthentication.new.autocreation_enabled?.should be_false
    end
  end
end

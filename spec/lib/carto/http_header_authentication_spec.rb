# encoding: utf-8

require 'ostruct'
require 'uuidtools'
require_relative '../../spec_helper'
require_relative '../../../lib/carto/http_header_authentication'
require_relative '../../requests/http_authentication_helper'

describe Carto::HttpHeaderAuthentication do
  include HttpAuthenticationHelper

  EMAIL = "user@carto.com"
  USERNAME = "user"
  ID = UUIDTools::UUID.timestamp_create.to_s

  let(:mock_unauthenticated_request) do
    OpenStruct.new(headers: {})
  end

  let(:mock_email_request) { OpenStruct.new(headers: { "#{authenticated_header}" => EMAIL }) }
  let(:mock_username_request) { OpenStruct.new(headers: { "#{authenticated_header}" => USERNAME }) }
  let(:mock_id_request) { OpenStruct.new(headers: { "#{authenticated_header}" => ID }) }

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
      stub_http_header_authentication_configuration(field: 'email')
      Carto::HttpHeaderAuthentication.new.valid?(mock_unauthenticated_request).should == false
    end

    it 'returns true with configuration and header' do
      stub_http_header_authentication_configuration(field: 'email')
      Carto::HttpHeaderAuthentication.new.valid?(mock_email_request).should == true
    end
  end

  describe '#get_user?' do
    before(:each) do
      stub_http_header_authentication_configuration(field: 'email')
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
        stub_http_header_authentication_configuration(field: 'auto')
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
      stub_http_header_authentication_configuration(field: 'auto', autocreation: true)
      Carto::HttpHeaderAuthentication.new.autocreation_enabled?.should be_true
      stub_http_header_authentication_configuration(field: 'auto', autocreation: false)
      Carto::HttpHeaderAuthentication.new.autocreation_enabled?.should be_false
    end
  end

  describe '#email' do
    let(:authenticator) { Carto::HttpHeaderAuthentication.new }

    it 'returns email for email requests' do
      stub_http_header_authentication_configuration(field: 'email')
      authenticator.email(mock_email_request).should == EMAIL
    end

    it 'raises error if configuration is not email (or auto with an email in the request)' do
      stub_http_header_authentication_configuration(field: 'id')
      expect { authenticator.email(mock_email_request) }.to raise_error
      stub_http_header_authentication_configuration(field: 'username')
      expect { authenticator.email(mock_email_request) }.to raise_error
      stub_http_header_authentication_configuration(field: 'auto')
      expect { authenticator.email(mock_username_request) }.to raise_error
    end

    it 'returns email if configuration is auto and request contains an email' do
      stub_http_header_authentication_configuration(field: 'auto')
      expect { authenticator.email(mock_email_request) }.not_to raise_error
    end
  end

  describe '#creation_in_progress?' do
    let(:authenticator) { Carto::HttpHeaderAuthentication.new }

    it 'returns true if there is a matching creation in progress by (user) id' do
      stub_http_header_authentication_configuration(field: 'id')
      uc = FactoryGirl.create(:user_creation, state: 'enqueuing', user_id: ID)
      authenticator.creation_in_progress?(mock_id_request).should be_true
      uc.destroy
    end

    it 'returns true if there is a matching creation in progress by username' do
      stub_http_header_authentication_configuration(field: 'username')
      uc = FactoryGirl.create(:user_creation, state: 'enqueuing', username: USERNAME)
      authenticator.creation_in_progress?(mock_username_request).should be_true
      uc.destroy
    end

    it 'returns true if there is a matching creation in progress by email' do
      stub_http_header_authentication_configuration(field: 'email')
      uc = FactoryGirl.create(:user_creation, state: 'enqueuing', email: EMAIL)
      authenticator.creation_in_progress?(mock_email_request).should be_true
      uc.destroy
    end

    it 'returns false if there is not a matching creation in progress' do
      stub_http_header_authentication_configuration(field: 'auto')
      authenticator.creation_in_progress?(mock_email_request).should be_false
    end
  end
end

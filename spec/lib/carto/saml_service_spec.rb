require 'carto/saml_service'
require 'spec_helper_min'

describe Carto::SamlService do
  let(:saml_config) do
    {
      issuer: 'localhost.lan',
      idp_sso_target_url: 'https://example.com/saml/signon/',
      idp_slo_target_url: 'https://example.com/saml/signon/',
      idp_cert_fingerprint: '',
      assertion_consumer_service_url: 'https://localhost.lan/saml/finalize',
      name_identifier_format: '',
      email_attribute: 'username'
    }
  end

  let(:service) do
    Carto::SamlService.new
  end

  it 'is enabled if there is configuration' do
    Cartodb.stubs(:config).returns(saml_authentication: saml_config)
    service.enabled?.should be_true
  end

  describe 'Integration logic' do
    # This stubs the SAML external integration
    let(:response_mock) { mock }
    let(:saml_response_param_mock) { mock }

    before(:each) do
      Cartodb.stubs(:config).returns(saml_authentication: saml_config)
      service.stubs(:get_saml_response).returns(response_mock)
    end

    describe '#subdomain' do
      it 'returns nil if response is invalid' do
        response_mock.stubs(:is_valid?).returns(false)

        service.subdomain(saml_response_param_mock).should be_nil
      end

      it 'returns nil if a valid response does not contain the username' do
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => nil)

        service.subdomain(saml_response_param_mock).should be_nil

        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => '')

        service.subdomain(saml_response_param_mock).should be_nil
      end

      it 'returns email username from the username attribute' do
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => 'wadus@carto.com')

        service.subdomain(saml_response_param_mock).should eq 'wadus'
      end
    end

    describe '#get_user' do
      it 'returns nil if response is invalid' do
        response_mock.stubs(:is_valid?).returns(false)

        service.get_user(saml_response_param_mock).should be_nil
      end

      it 'returns nil if there is not a user with matching email' do
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => 'wadus@carto.com')

        service.get_user(saml_response_param_mock).should be_nil
      end

      it 'returns the user with matching email' do
        ::User.any_instance.stubs(:after_create).returns(true)
        user = FactoryGirl.create(:carto_user)

        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => user.email)

        service.get_user(saml_response_param_mock).id.should eq user.id

        user.delete
      end
    end
  end
end

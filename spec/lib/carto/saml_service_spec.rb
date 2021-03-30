require 'carto/saml_service'
require 'spec_helper_min'

describe Carto::SamlService do
  let!(:organization) { create(:saml_organization) }
  let(:service) { Carto::SamlService.new(organization) }
  let(:saml_config) { organization.auth_saml_configuration }

  describe 'configuration support' do
    it 'is disabled if there is no configuration or it is empty' do
      org = build(:organization, auth_saml_configuration: nil)
      Carto::SamlService.new(org).enabled?.should be_false

      org = build(:organization, auth_saml_configuration: {})
      Carto::SamlService.new(org).enabled?.should be_false
    end

    it 'is enabled if there is configuration' do
      service.enabled?.should be_true
    end

    it 'email_attribute doesnt return the default value if its defined' do
      saml_config[:email_attribute] = 'defined_username'
      service.send(:email_attribute).should eq 'defined_username'
      saml_config[:email_attribute] = nil
      service.send(:email_attribute).should eq 'name_id'
    end
  end

  describe 'Integration logic' do
    let(:response_mock) { mock }
    let(:saml_response_param_mock) { mock }

    before do
      Cartodb.stubs(:config).returns(saml_authentication: saml_config)
      service.stubs(:get_saml_response).returns(response_mock)
      service.stubs(:debug_response)
    end

    describe '#get_user_email' do
      it 'returns nil if response is invalid' do
        response_mock.stubs(:is_valid?).raises(OneLogin::RubySaml::ValidationError.new)

        service.get_user_email(saml_response_param_mock).should be_nil
      end

      it 'returns nil if response lacks email' do
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config.except(:email_attribute))

        service.get_user_email(saml_response_param_mock).should be_nil
      end

      it 'returns the user with matching email' do
        ::User.any_instance.stubs(:after_create).returns(true)
        user = create(:carto_user)
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => user.email)

        service.get_user_email(saml_response_param_mock).should eq user.email
      end
    end
  end
end

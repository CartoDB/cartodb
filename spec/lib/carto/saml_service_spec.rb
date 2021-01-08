require 'carto/saml_service'
require 'spec_helper_min'

describe Carto::SamlService do
  let!(:organization) { create(:saml_organization) }
  let(:service) { Carto::SamlService.new(organization) }
  let(:saml_config) { organization.auth_saml_configuration }

  describe 'configuration support' do
    it 'is disabled if there is no configuration or it is empty' do
      org = FactoryGirl.build(:organization, auth_saml_configuration: nil)
      Carto::SamlService.new(org).enabled?.should be_false

      org = FactoryGirl.build(:organization, auth_saml_configuration: {})
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
    let(:response_mock) { double }
    let(:saml_response_param_mock) { double }

    before do
      allow(Cartodb).to receive(:config).and_return(saml_authentication: saml_config)
      allow(service).to receive(:get_saml_response).and_return(response_mock)
      allow(service).to receive(:debug_response)
    end

    describe '#get_user_email' do
      it 'returns nil if response is invalid' do
        allow(response_mock).to receive(:is_valid?).and_raise(OneLogin::RubySaml::ValidationError.new)

        service.get_user_email(saml_response_param_mock).should be_nil
      end

      it 'returns nil if response lacks email' do
        allow(response_mock).to receive(:is_valid?).and_return(true)
        allow(response_mock).to receive(:attributes).and_return(saml_config.except(:email_attribute))

        service.get_user_email(saml_response_param_mock).should be_nil
      end

      it 'returns the user with matching email' do
        allow_any_instance_of(::User).to receive(:after_create).and_return(true)
        user = create(:carto_user)
        allow(response_mock).to receive(:is_valid?).and_return(true)
        allow(response_mock).to receive(:attributes).and_return(saml_config[:email_attribute] => user.email)

        service.get_user_email(saml_response_param_mock).should eq user.email
      end
    end
  end
end

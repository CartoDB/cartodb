require 'carto/saml_service'
require 'spec_helper_min'

describe Carto::SamlService do
  let(:service) do
    Carto::SamlService.new(@organization)
  end

  before(:all) do
    @organization = FactoryGirl.create(:saml_organization)
  end

  after(:all) do
    @organization.delete
  end

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
  end

  describe 'Integration logic' do
    # This stubs the SAML external integration
    let(:response_mock) { mock }
    let(:saml_response_param_mock) { mock }
    let(:saml_config) { @organization.auth_saml_configuration }

    before(:each) do
      Cartodb.stubs(:config).returns(saml_authentication: saml_config)
      service.stubs(:get_saml_response).returns(response_mock)
      service.stubs(:debug_response)
    end

    describe '#username' do
      it 'returns nil if response is invalid' do
        response_mock.stubs(:is_valid?).returns(false)

        expect {
          service.username(saml_response_param_mock)
        }.to raise_error(Carto::UnprocesableEntityError)
      end

      it 'returns nil if a valid response does not contain the username' do
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => nil)

        service.username(saml_response_param_mock).should be_nil

        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => '')

        service.username(saml_response_param_mock).should be_nil
      end

      it 'returns username from the user with the matching email' do
        user = create_test_saml_user
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => user.email)

        service.username(saml_response_param_mock).should eq user.username
        user.delete
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
        user = create_test_saml_user
        response_mock.stubs(:is_valid?).returns(true)
        response_mock.stubs(:attributes).returns(saml_config[:email_attribute] => user.email)

        service.get_user(saml_response_param_mock).id.should eq user.id

        user.delete
      end
    end

    def create_test_saml_user
      ::User.any_instance.stubs(:after_create).returns(true)
      FactoryGirl.create(:carto_user)
    end
  end
end

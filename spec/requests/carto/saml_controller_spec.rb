require 'spec_helper_min'

describe Carto::SamlController do
  before(:all) do
    @organization = create(:saml_organization)
  end

  after(:all) do
    @organization.destroy
  end

  it 'shows SAML metadata' do
    get saml_metadata_url(user_domain: @organization.name)
    response.status.should eq 200
  end

  it 'returns an error for non-existing organizations' do
    get saml_metadata_url(user_domain: 'wadus')
    response.status.should eq 404
  end

  it 'returns an error for non-configured organizations' do
    Carto::Organization.any_instance.stubs(:auth_saml_enabled?).returns(false)
    get saml_metadata_url(user_domain: @organization.name)
    response.status.should eq 403
  end
end

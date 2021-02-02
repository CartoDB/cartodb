require_relative '../../acceptance_helper'

describe Superadmin::OrganizationsController do
  let(:authentication_headers) do
    {
      'HTTP_AUTHORIZATION' => ActionController::HttpAuthentication::Basic.encode_credentials(
        Cartodb.config[:superadmin]['username'],
        Cartodb.config[:superadmin]['password']
      ),
      'HTTP_ACCEPT' => 'application/json'
    }
  end
  let!(:organization) { create_organization_with_users }

  # TODO: shouldn't be necessary once we setup DatabaseCleaner
  after { Carto::Organization.delete_all }

  it 'requires HTTP authentication' do
    get_json superadmin_organization_path(organization), {}

    expect(response.status).to eq(401)
  end

  # GET /superadmin/organization/:id
  describe '#show' do
    let(:response_body) { JSON.parse(response.body).with_indifferent_access }

    it 'returns the specified organization' do
      get_json superadmin_organization_path(organization), {}, authentication_headers

      expect(response.status).to eq(200)
      expect(response_body[:id]).to eq(organization.id)
    end
  end

  # GET /superadmin/organization
  describe '#index' do
    let(:response_body) { JSON.parse(response.body).map(&:with_indifferent_access) }
    let(:first_organization) { response_body.first }

    before { create_organization_with_users }

    it 'returns all the organizations' do
      get_json superadmin_organizations_path, {}, authentication_headers

      expect(response.status).to eq(200)
      expect(first_organization[:name]).to eq(organization.name)
      expect(response_body.size).to eq(2)
    end

    it 'returns organizations overquota' do
      Carto::Organization.stubs(:overquota).returns [organization]
      get_json superadmin_organizations_path, { overquota: true }, authentication_headers

      expect(response.status).to eq(200)
      expect(response_body.first[:name]).to eq(organization.name)
      expect(response_body.size).to eq(1)
    end

    it 'returns geocoding and mapviews quotas and uses for all organizations' do
      Carto::Organization.stubs(:overquota).returns [organization]
      ::User.any_instance.stubs(:get_geocoding_calls).returns(100)
      ::User.any_instance.stubs(:map_views_count).returns (0..30).to_a

      get_json superadmin_organizations_path, { overquota: true }, authentication_headers

      expect(response.status).to eq(200)
      expect(first_organization[:name]).to eq(organization.name)
      expect(first_organization[:geocoding][:quota]).to eq(organization.geocoding_quota)
      expect(first_organization[:geocoding][:monthly_use]).to eq(organization.get_geocoding_calls)
      expect(first_organization[:map_views_quota]).to eq(organization.map_views_quota)
      expect(first_organization[:map_views]).to eq(organization.map_views_count)
      expect(response_body.size).to eq(1)
    end
  end
end

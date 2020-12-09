require 'spec_helper_min'
require_dependency 'carto/oauth_provider/scopes/scopes'
require_relative '../../../../factories/organizations_contexts'

describe Carto::OauthProvider::Scopes::DataservicesScope do
  include_context 'organization with users helper'

  describe '#add_to_api_key_grants' do
    let(:scope) { Carto::OauthProvider::Scopes::DataservicesScope.new('geocoding', 'GC') }

    it 'adds SQL api and dataservice' do
      grants = [{ type: 'apis', apis: [] }]
      scope.add_to_api_key_grants(grants, nil)
      expect(grants).to(eq([{ type: 'apis', apis: ['sql'] }, { type: 'dataservices', services: ['geocoding'] }]))
    end

    it 'does not add duplicate SQL api' do
      grants = [{ type: 'apis', apis: ['sql'] }]
      scope.add_to_api_key_grants(grants, nil)
      expect(grants).to(include(type: 'apis', apis: ['sql']))
    end
  end
end

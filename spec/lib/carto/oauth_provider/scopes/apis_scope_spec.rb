require 'spec_helper_min'
require_dependency 'carto/oauth_provider/scopes/scopes'
require_relative '../../../../factories/organizations_contexts'

describe Carto::OauthProvider::Scopes::ApisScope do
  include_context 'organization with users helper'

  describe '#add_to_api_key_grants' do
    it 'adds apis scope with do subset' do
      scope = Carto::OauthProvider::Scopes::ApisScope.new('do', 'Data Observatory API')
      grants = [{ type: 'apis', apis: [] }]
      scope.add_to_api_key_grants(grants, nil)
      expect(grants).to(eq([{ type: 'apis', apis: ['do'] }]))
    end
  end
end

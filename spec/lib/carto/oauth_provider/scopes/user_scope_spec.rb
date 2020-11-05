require 'spec_helper_min'
require_dependency 'carto/oauth_provider/scopes/scopes'
require_relative '../../../../factories/organizations_contexts'

describe Carto::OauthProvider::Scopes::UserScope do
  include_context 'organization with users helper'

  describe '#add_to_api_key_grants' do
    it 'adds user scope with profile subset' do
      scope = Carto::OauthProvider::Scopes::UserScope.new('profile', 'User public profile')
      grants = [{ type: 'apis', apis: [] }]
      scope.add_to_api_key_grants(grants, nil)
      expect(grants).to(eq([{ type: 'apis', apis: [] }, { type: 'user', data: ['profile'] }]))
    end
  end
end

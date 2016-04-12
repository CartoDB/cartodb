# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/user_creations_controller'
require_dependency 'carto/uuidhelper'

include Carto::UUIDHelper

describe Carto::Api::InvitationsController do
  include_context 'organization with users helper'

  describe 'create' do
    def post_api_v1_organization_invitations(user, invitation, organization_id = user.organization.id)
      invitation ||= {}
      post_json api_v1_organization_invitations_create_url(user_domain: user.username,
                                                           organization_id: organization_id,
                                                           api_key: user.api_key), invitation do |response|
        yield response
      end
    end

    it 'returns 404 for unknown organizations' do
      post_api_v1_organization_invitations(@org_user_owner, nil, random_uuid) do |response|
        response.status.should == 404
      end
    end

    # Disabled since this still returns 404
    xit 'returns 401 unless you are the owner of the organization' do
      post_api_v1_organization_invitations(@org_user_1, nil) do |response|
        response.status.should == 401
      end
    end

    it 'registers invitations with a token seed returning its json' do
      invitation = {
        users_emails: ['email_a@cartodb.com', 'email_b@cartodb.com'],
        welcome_text: 'Please join my organization!'
      }
      post_api_v1_organization_invitations(@org_user_owner, invitation) do |response|
        response.status.should == 200
        response.body[:id].should_not be_nil
        response.body[:users_emails].should == invitation[:users_emails]
        response.body[:welcome_text].should == invitation[:welcome_text]

        invitation = Carto::Invitation.find(response.body[:id]).seed.should_not be_nil
      end
    end

    it 'fails if a user with any of the emails already exists' do
      welcome_text = 'invitation creation should fail'
      invitation = {
        users_emails: [@org_user_1.email, 'whatever@cartodb.com'],
        welcome_text: welcome_text
      }
      post_api_v1_organization_invitations(@org_user_owner, invitation) do |response|
        response.status.should == 400
        response.body[:errors]['users_emails'].length.should == 1

        invitation = Carto::Invitation.find_by_welcome_text(welcome_text).should == nil
      end
    end
  end
end

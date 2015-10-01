# encoding: utf-8

require_relative '../../spec_helper'
require_relative '../../../app/models/carto/invitation'
require_relative '../../../app/controllers/carto/api/user_creations_controller'
require_relative '../../../lib/resque/user_jobs'

describe Carto::Invitation do
  include_context 'organization with users helper'

  describe 'creation' do

    it 'fails for existing users' do
      invitation = Carto::Invitation.create_new(@carto_org_user_owner, [@carto_org_user_1.email], 'hi')
      invitation.valid?.should == false
    end

    it 'fails for non-owner users' do
      expect { Carto::Invitation.create_new(@carto_org_user_1, ['no@cartodb.com'], 'hi') }.to raise_error CartoDB::InvalidUser
    end

    it 'sends invitations' do
      ::Resque.expects(:enqueue).with(Resque::OrganizationJobs::Mail::Invitation, instance_of(String)).once
      invitation = Carto::Invitation.create_new(@carto_org_user_owner, ['whatever_1@cartodb.com', 'whatever_2@cartodb.com'], 'hi')
      invitation.user_id.should == @carto_org_user_owner.id
      invitation.organization_id.should == @carto_org_user_owner.organization_id
    end

  end

  describe 'token' do

    before(:each) do
      @invitation = Carto::Invitation.create_new(@carto_org_user_owner, [], 'Welcome!')
      @invitation_2 = Carto::Invitation.create_new(@carto_org_user_owner, [], 'Welcome!')
    end
    
    it 'returns the same token for the same email' do
      email = 'myemail@cartodb.com'
      t1 = @invitation.token(email)
      t2 = @invitation.token(email)
      t1.should == t2
    end

    it 'returns different tokens for different emails' do
      t1 = @invitation.token('email1@cartodb.com')
      t2 = @invitation.token('email2@cartodb.com')
      t1.should_not == t2
    end

    it 'returns different tokens using the same email with different invitations' do
      email = 'myemail@cartodb.com'
      t1 = @invitation.token(email)
      t2 = @invitation_2.token(email)
      t1.should_not == t2
    end

    it 'has a length > 10' do
      @invitation.token('email1@cartodb.com').length.should > 10
    end

  end

  describe '#use' do

    before(:each) do
      @valid_email = 'email1@cartodb.com'
      @valid_email_2 = 'email2@cartodb.com'
      @invitation = Carto::Invitation.create_new(@carto_org_user_owner, [@valid_email, @valid_email_2], 'Welcome!')
      @token = @invitation.token(@valid_email)
      @token_2 = @invitation.token(@valid_email_2)
    end

    it 'return true for valid emails + token' do
      @invitation.use(@valid_email, @token).should == true
    end

    it 'return false for non valid emails' do
      @invitation.use('fake@cartodb.com', @token).should == false
    end

    it 'return false for non valid tokens' do
      @invitation.use(@valid_email, 'fake_token').should == false
    end

    it 'triggers an AlreadyUsedInvitationError if a user uses it twice' do
      @invitation.use(@valid_email, @token)
      @invitation.use(@valid_email_2, @token_2)
      @invitation.reload
      expect { @invitation.use(@valid_email, @token) }.to raise_error AlreadyUsedInvitationError
      expect { @invitation.use(@valid_email_2, @token_2) }.to raise_error AlreadyUsedInvitationError
    end

  end

end

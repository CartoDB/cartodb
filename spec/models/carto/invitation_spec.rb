require 'spec_helper_unit'
require_relative '../../factories/organizations_contexts'
require_relative '../../../app/controllers/carto/api/user_creations_controller'
require_relative '../../../lib/resque/user_jobs'

describe Carto::Invitation do
  let(:organization) { create(:organization_with_users) }
  let(:organization_owner) { organization.owner }
  let(:organization_user) { organization.non_owner_users.first }

  describe 'creation' do
    it 'fails for existing users' do
      invitation = Carto::Invitation.create_new(organization_owner, [organization_user.email], 'hi', false)
      invitation.valid?.should == false
    end

    it 'fails for non-owner users' do
      expect do
        Carto::Invitation.create_new(organization_user, ['no@carto.com'], 'hi', false)
      end.to raise_error CartoDB::InvalidUser
    end

    it 'fails for wrong emails' do
      invitation = Carto::Invitation.create_new(organization_owner, ['no', 'neither@'], 'hi', false)
      invitation.valid?.should == false
      invitation.errors[:users_emails].count.should == 2
    end

    it 'sends invitations' do
      ::Resque.expects(:enqueue).with(Resque::OrganizationJobs::Mail::Invitation, instance_of(String)).once
      emails = ['w_1@carto.com', 'w_2@carto.com']
      invitation = Carto::Invitation.create_new(organization_owner, emails, 'hi', false)
      invitation.inviter_user_id.should == organization_owner.id
      invitation.organization_id.should == organization_owner.organization_id
    end
  end

  describe 'token' do
    before do
      @invitation = Carto::Invitation.create_new(organization_owner, [], 'Welcome!', false)
      @invitation_2 = Carto::Invitation.create_new(organization_owner, [], 'Welcome!', false)
    end

    it 'returns the same token for the same email' do
      email = 'myemail@carto.com'
      t1 = @invitation.token(email)
      t2 = @invitation.token(email)
      t1.should == t2
    end

    it 'returns different tokens for different emails' do
      t1 = @invitation.token('email1@carto.com')
      t2 = @invitation.token('email2@carto.com')
      t1.should_not == t2
    end

    it 'returns different tokens using the same email with different invitations' do
      email = 'myemail@carto.com'
      t1 = @invitation.token(email)
      t2 = @invitation_2.token(email)
      t1.should_not == t2
    end

    it 'has a length > 10' do
      @invitation.token('email1@carto.com').length.should > 10
    end
  end

  describe '#use' do
    before do
      @valid_email = 'email1@carto.com'
      @valid_email_2 = 'email2@carto.com'
      @invitation = Carto::Invitation.create_new(
        organization_owner,
        [@valid_email, @valid_email_2],
        'Welcome!',
        false
      )
      @token = @invitation.token(@valid_email)
      @token_2 = @invitation.token(@valid_email_2)
    end

    it 'return true for valid emails + token' do
      @invitation.use(@valid_email, @token).should == true
    end

    it 'return false for non valid emails' do
      @invitation.use('fake@carto.com', @token).should == false
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

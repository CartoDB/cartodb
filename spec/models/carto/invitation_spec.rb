# encoding: utf-8

require_relative '../../spec_helper'
require_relative '../../../app/models/carto/invitation'

describe Carto::Invitation do

  describe 'token' do

    before(:each) do
      @invitation = Carto::Invitation.create_new([], 'Welcome!')
      @invitation_2 = Carto::Invitation.create_new([], 'Welcome!')
    end
    
    it 'returns the same token for the same email' do
      email = 'myemail@cartodb.com'
      t1 = @invitation.token(email)
      t2 = @invitation.token(email)
      t1.should == t2
    end

    it 'returns different tokens for different emails' do
      t1 = @invitation.token('email1@gmail.com')
      t2 = @invitation.token('email2@gmail.com')
      t1.should_not == t2
    end

    it 'returns different tokens using the same email with different invitations' do
      email = 'myemail@cartodb.com'
      t1 = @invitation.token(email)
      t2 = @invitation_2.token(email)
      t1.should_not == t2
    end

    it 'has a length > 10' do
      @invitation.token('email1@gmail.com').length.should > 10
    end

  end

end

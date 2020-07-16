require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/authentication_manager.rb'

module Carto
  describe AuthenticationManager do

    describe '::validate_session' do
      subject { described_class.validate_session(warden_context, request, user) }

      let!(:user) { create(:user) }
      let(:valid_session) { { sec_token: user.security_token } }
      let(:warden_context) { mock }
      let(:request) { mock }

      context 'when session is valid' do
        before { warden_context.expects(:session).returns(valid_session) }

        it { should be_true }
      end

      context 'when no session' do
        before do
          request.expects(:reset_session)
          warden_context.expects(:session).returns({})
        end

        it { should be_false }
      end

      context 'when session was invalidated' do
        let(:session) { { sec_token: 'old-security-token' } }

        before { warden_context.expects(:session).returns(session) }

        it 'raises an error' do
          expect { subject }.to raise_error(Carto::ExpiredSessionError)
        end
      end

      context 'when authenticating with a valid method and no session' do
        before do
          request.expects(:reset_session)
          warden_context.expects(:session).raises(Warden::NotAuthenticated)
        end

        it { should be_false }
      end
    end

  end
end

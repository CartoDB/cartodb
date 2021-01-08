require_relative '../../spec_helper_min.rb'
require_relative '../../../lib/carto/authentication_manager.rb'

module Carto
  describe AuthenticationManager do

    describe '::validate_session' do
      subject { described_class.validate_session(warden_context, request, user) }

      let!(:user) { create(:user) }
      let(:valid_session) { { sec_token: user.security_token } }
      let(:warden_context) { double }
      let(:request) { double }

      context 'when session is valid' do
        before { expect(warden_context).to receive(:session).and_return(valid_session) }

        it { should be_true }
      end

      context 'when no session' do
        before do
          expect(request).to receive(:reset_session)
          expect(warden_context).to receive(:session).and_return({})
        end

        it { should be_false }
      end

      context 'when session was invalidated' do
        let(:session) { { sec_token: 'old-security-token' } }

        before { expect(warden_context).to receive(:session).and_return(session) }

        it 'raises an error' do
          expect { subject }.to raise_error(Carto::ExpiredSessionError)
        end
      end

      context 'when authenticating with a valid method and no session' do
        before do
          expect(request).to receive(:reset_session)
          expect(warden_context).to receive(:session).and_raise(Warden::NotAuthenticated)
        end

        it { should be_false }
      end
    end

  end
end

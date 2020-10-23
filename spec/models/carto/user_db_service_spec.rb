require_relative '../../spec_helper_min'

describe Carto::UserDBService do
  let(:user) { create(:carto_user) }
  let(:db_service) { Carto::UserDBService.new(user) }

  describe '#public_user_roles' do
    subject { db_service.public_user_roles }

    context 'for non-organization users' do
      it 'should return public user for non-org users' do
        expect(subject).to eq [CartoDB::PUBLIC_DB_USER]
      end
    end

    context 'for organization users' do
      let(:organization) { create(:organization_with_users) }
      let(:user) { organization.users.first.carto_user }

      it 'should return public user and org public user for org users' do
        expect(subject).to eq [CartoDB::PUBLIC_DB_USER, "cartodb_publicuser_#{user.id}"]
      end
    end
  end

  describe '#pg_server_version' do
    subject { db_service.pg_server_version }

    it 'returns the PostgreSQL server version number' do
      # Support all versions of CI. Don't stub as that would make the spec useless.
      # rubocop:disable Style/NumericLiterals
      expect([11_00_05, 12_00_01, 12_00_02]).to include(subject)
      # rubocop:enable Style/NumericLiterals
    end
  end
end

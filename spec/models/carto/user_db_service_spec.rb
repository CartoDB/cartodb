require 'spec_helper_unit'

describe Carto::UserDBService do
  include Carto::Factories::Visualizations

  let(:user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
  let(:db_service) { user.db_service }

  describe '#public_user_roles' do
    subject(:public_user_roles) { db_service.public_user_roles }

    context 'with non-organization users' do
      it 'returns public user for non-org users' do
        expect(public_user_roles).to eq [CartoDB::PUBLIC_DB_USER]
      end
    end

    context 'with organization users' do
      let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
      let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
      let(:user) { organization.owner }

      it 'returns public user and org public user for org users' do
        expect(public_user_roles).to eq [CartoDB::PUBLIC_DB_USER, "cartodb_publicuser_#{user.id}"]
      end
    end
  end

  describe '#pg_server_version' do
    subject(:pg_server_version) { db_service.pg_server_version }

    it 'returns the PostgreSQL server version number' do
      # Support all versions of CI. Don't stub as that would make the spec useless.
      # rubocop:disable Style/NumericLiterals
      expect(
        [11_00_05, 12_00_01, 12_00_02, 12_00_07].find { |v| v == pg_server_version }
      ).to be_present
      # rubocop:enable Style/NumericLiterals
    end
  end

  describe '#sequences_for_tables' do
    subject(:sequences) { db_service.sequences_for_tables(tables) }

    let(:table_1) { create_full_visualization(user)[1] }
    let(:table_2) { create_full_visualization(user)[1] }
    let(:tables) do
      [
        { schema: table_1.user.database_schema, table_name: table_1.name },
        { schema: table_2.user.database_schema, table_name: table_2.name }
      ]
    end

    it 'returns the sequences for the requested tables' do
      expect(sequences).to include("\"public\".#{table_1.name}_cartodb_id_seq")
      expect(sequences).to include("\"public\".#{table_2.name}_cartodb_id_seq")
    end

    context 'when no tables are requested' do
      let(:tables) { [] }

      it { should be_empty }
    end
  end
end

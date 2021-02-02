require 'spec_helper_min'
require './spec/support/factories/organizations'
require_dependency 'carto/oauth_provider/scopes/scopes'

describe Carto::OauthProvider::Scopes::AllDatasetsScope do
  include CartoDB::Factories
  include Carto::Factories::Visualizations

  let(:r_scope_string) { 'datasets:r:*' }
  let(:rw_scope_string) { 'datasets:rw:*' }
  let(:invalid_scope_string) { 'datasets:rx:*' }
  let(:scope_string) { r_scope_string }
  let(:scope) { described_class.new(scope_string) }
  let(:user) { create(:valid_user).carto_user }
  let!(:organization) { OrganizationFactory.new.create_organization_with_users }
  let!(:org_admin) { organization.owner }
  let(:organization_user) { organization.users.where.not(id: org_admin.id).first }
  let(:tables_grants) { grants.find { |grant| grant[:type] == 'database' }[:tables] }

  describe '::is_a?' do
    subject { described_class.is_a?(scope_string) }

    context 'when scope matches' do
      it { should be_true }
    end

    context 'when scope does not match' do
      let(:scope_string) { invalid_scope_string }

      it { should be_false }
    end
  end

  describe '::valid_scopes' do
    subject(:valid_scopes) { described_class.valid_scopes([r_scope_string, rw_scope_string, invalid_scope_string]) }

    it 'returns only the valid scopes' do
      expect(valid_scopes).to include(r_scope_string)
      expect(valid_scopes).to include(rw_scope_string)
      expect(valid_scopes).not_to include(invalid_scope_string)
    end
  end

  describe '#name' do
    subject(:name) { scope.name }

    context 'for read permissions' do
      it 'returns the scope name' do
        expect(name).to eq('datasets:r:*')
      end
    end

    context 'for read-write permissions' do
      let(:scope_string) { rw_scope_string }

      it 'returns the scope name' do
        expect(name).to eq('datasets:rw:*')
      end
    end
  end

  describe '#add_to_api_key_grants' do
    let!(:user_table) { create_full_visualization(user)[2] }
    let(:grants) { [{ type: 'apis', apis: [] }] }
    let(:granted_permissions) { tables_grants.find { |t| t[:name] == user_table.name }[:permissions] }
    let(:granted_tables) { tables_grants.map { |table| table[:name] } }

    context 'when granting read-only permissions' do
      before { scope.add_to_api_key_grants(grants, user) }

      it 'only grants read permissions' do
        expect(granted_permissions).to include('select')
        expect(granted_permissions).not_to include('insert')
        expect(granted_permissions).not_to include('update')
        expect(granted_permissions).not_to include('delete')
      end
    end

    context 'when granting read-write permissions' do
      let(:scope_string) { rw_scope_string }

      before { scope.add_to_api_key_grants(grants, user) }

      it 'grants read-write permissions' do
        expect(granted_permissions).to include('select')
        expect(granted_permissions).to include('insert')
        expect(granted_permissions).to include('update')
        expect(granted_permissions).to include('delete')
      end
    end

    context 'when user belongs to organization' do
      let(:user) { organization_user }
      let!(:other_user_table) { create_full_visualization(org_admin)[2] }

      before do
        user.update!(organization: organization)
        scope.add_to_api_key_grants(grants, user)
      end

      it 'only grants permissions to user datasets when in an organization' do
        expect(granted_tables).to include(user_table.name)
        expect(granted_tables).not_to include(other_user_table.name)
      end
    end

    context 'when user has access to other shared datasets' do
      let(:user) { organization_user }
      let(:full_visualization_objects) { create_full_visualization(org_admin) }
      let(:other_table) { full_visualization_objects[1] }
      let!(:other_user_table) { full_visualization_objects[2] }
      let(:granted_permissions) { tables_grants.find { |t| t[:name] == other_user_table.name }[:permissions] }

      context 'with read-only access' do
        before do
          share_table_with_user(other_table, user)
          scope.add_to_api_key_grants(grants, user)
        end

        it 'only grants read permissions' do
          expect(granted_tables).to include(other_user_table.name)

          expect(granted_permissions).to include('select')
          expect(granted_permissions).not_to include('insert')
          expect(granted_permissions).not_to include('update')
          expect(granted_permissions).not_to include('delete')
        end
      end

      context 'with read-write access' do
        let(:scope_string) { rw_scope_string }

        before do
          share_table_with_user(other_table, user, access: Carto::Permission::ACCESS_READWRITE)
          scope.add_to_api_key_grants(grants, user)
        end

        it 'grants read-write permissions' do
          expect(granted_tables).to include(other_user_table.name)

          expect(granted_permissions).to include('select')
          expect(granted_permissions).to include('insert')
          expect(granted_permissions).to include('update')
          expect(granted_permissions).to include('delete')
        end
      end
    end

    it 'does not grant permissions over internal tables' do
      scope.add_to_api_key_grants(grants, user)

      expect(granted_tables).not_to include('spatial_ref_sys')
    end
  end
end

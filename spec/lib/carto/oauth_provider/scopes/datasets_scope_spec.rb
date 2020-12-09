require 'spec_helper_min'
require_dependency 'carto/oauth_provider/scopes/scopes'
require_relative '../../../../factories/organizations_contexts'

describe Carto::OauthProvider::Scopes::DatasetsScope do
  include_context 'organization with users helper'

  describe '#add_to_api_key_grants' do
    let(:full_dataset_scope) { Carto::OauthProvider::Scopes::DatasetsScope.new('datasets:rw:untitled_table') }
    let(:read_dataset_scope) { Carto::OauthProvider::Scopes::DatasetsScope.new('datasets:r:untitled_table') }
    let(:schema_scope) { Carto::OauthProvider::Scopes::SchemasScope.new('schemas:c') }
    let(:dataset_metadata_scope) { Carto::OauthProvider::Scopes::DatasetsMetadataScope.new('datasets:metadata') }
    let(:full_table_grants) do
      [
        {
          apis: [
            'maps',
            'sql'
          ],
          type: 'apis'
        },
        {
          tables: [
            {
              name: 'untitled_table',
              permissions: [
                'select',
                'insert',
                'update',
                'delete'
              ],
              schema: 'wadus'
            }
          ],
          schemas: [
            {
              name: 'wadus',
              permissions: [
                'create'
              ]
            }
          ],
          type: 'database'
        }
      ]
    end
    let(:read_table_grants) do
      [
        {
          apis: [
            'maps',
            'sql'
          ],
          type: 'apis'
        },
        {
          tables: [
            {
              name: 'untitled_table',
              permissions: [
                'select'
              ],
              schema: 'wadus'
            }
          ],
          type: 'database'
        }
      ]
    end

    let(:metadata_grants) do
      [
        {
          apis: [
            'sql'
          ],
          type: 'apis'
        },
        {
          table_metadata: [],
          type: 'database'
        }
      ]
    end

    before(:all) do
      @user = mock
      @user.stubs(:database_schema).returns('wadus')
    end

    it 'adds full access permissions' do
      grants = [{ type: 'apis', apis: [] }]
      full_dataset_scope.add_to_api_key_grants(grants, @user)
      schema_scope.add_to_api_key_grants(grants, @user)
      expect(grants).to(eq(full_table_grants))
    end

    it 'does not add write permissions' do
      grants = [{ type: 'apis', apis: [] }]
      read_dataset_scope.add_to_api_key_grants(grants, @user)
      expect(grants).to(eq(read_table_grants))
    end

    it 'adds metadata permissions' do
      grants = [{ type: 'apis', apis: [] }]
      dataset_metadata_scope.add_to_api_key_grants(grants, @user)
      expect(grants).to(eq(metadata_grants))
    end

    it 'does add full access permissions and metadata' do
      grants = [{ type: 'apis', apis: [] }]
      dataset_metadata_scope.add_to_api_key_grants(grants, @user)
      full_dataset_scope.add_to_api_key_grants(grants, @user)
      expect(grants[1]).to have_key(:table_metadata)
      expect(grants[1]).to have_key(:tables)
    end
  end
end

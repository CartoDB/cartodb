require 'spec_helper_min'
require 'carto/oauth_provider/scopes'
require_relative '../../../factories/organizations_contexts'

describe Carto::OauthProvider::Scopes do
  include_context 'organization with users helper'

  describe '#invalid_scopes' do
    include Carto::OauthProvider::Scopes
    before :all do
      @user = Carto::User.find(create_user.id)
      @user_table = FactoryGirl.create(:carto_user_table, :with_db_table, user_id: @user.id)
    end

    after :all do
      @user_table.destroy
      @user.destroy
    end

    it 'detects invalid dataset and schemas scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes(
        [
          "datasets:r:twf",
          "datasets:rw:twf",
          "datasets:rw:a.twf",
          "datasets:rw:a.a.twf",
          "datasets:c:a.twf",
          "schemas:c",
          "schemas:c:public",
          "schemas:c:a",
          'schemas:c:a.a',
          "schemas:w:a"
        ]
      )
      expect(scopes).to eq ["datasets:rw:a.a.twf", "datasets:c:a.twf", "schemas:w:a"]
    end

    it 'validates supported scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
        Carto::OauthProvider::Scopes::SUPPORTED_SCOPES,
        @user
      )
      expect(scopes).to be_empty
    end

    it 'returns non existent datasets scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(['datasets:r:wtf'], @user)
      expect(scopes).to eq(['datasets:r:wtf'])
    end

    it 'returns non existent schemas scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(['schemas:c:wtf'], @user)
      expect(scopes).to eq(['schemas:c:wtf'])
    end

    it 'validates non existent datasets scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes(['datasets:r:wtf'])
      expect(scopes).to be_empty
    end

    it 'validates non existent schemas scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes(['schemas:c:wtf'])
      expect(scopes).to be_empty
    end

    it 'validates existing datasets scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(["datasets:r:#{@user_table.name}"], @user)
      expect(scopes).to be_empty
    end

    it 'validates user schema scope' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(["schemas:c:#{@user.database_schema}"], @user)
      expect(scopes).to be_empty
    end

    it 'validates empty schema scope' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(["schemas:c"], @user)
      expect(scopes).to be_empty
    end

    it 'validates existing datasets with schema scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
        ["datasets:r:#{@user.database_schema}.#{@user_table.name}"],
        @user
      )
      expect(scopes).to be_empty
    end

    it 'returns datasets non existent datasets schema scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(["datasets:r:wtf.#{@user_table.name}"], @user)
      expect(scopes).to eq(["datasets:r:wtf.#{@user_table.name}"])
    end

    it 'returns datasets with 2 schemas scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
        ["datasets:r:#{@user.database_schema}.#{@user.database_schema}.#{@user_table.name}"],
        @user
      )
      expect(scopes).to eq(["datasets:r:#{@user.database_schema}.#{@user.database_schema}.#{@user_table.name}"])
    end

    it 'returns datasets scopes with non existent permissions' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(["datasets:f:#{@user_table.name}"], @user)
      expect(scopes).to eq(["datasets:f:#{@user_table.name}"])
    end

    it 'returns schemas scopes with non existent permissions' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(["schemas:c:pg_catalog"], @user)
      expect(scopes).to eq(["schemas:c:pg_catalog"])
    end

    it 'returns invalid datasets scopes' do
      scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(["wadusdatasets:r:#{@user_table.name}"], @user)
      expect(scopes).to eq(["wadusdatasets:r:#{@user_table.name}"])
    end

    describe 'views' do
      before :all do
        @view_name = "#{@user_table.name}_view"
        @materialized_view_name = "#{@user_table.name}_matview"
        @user.in_database do |db|
          query = %{
            CREATE VIEW #{@view_name} AS SELECT * FROM #{@user_table.name};
            CREATE MATERIALIZED VIEW #{@materialized_view_name} AS SELECT * FROM #{@user_table.name};
          }
          db.execute(query)
        end
      end

      after :all do
        @user.in_database do |db|
          query = %{
            DROP VIEW #{@view_name};
            DROP MATERIALIZED VIEW #{@materialized_view_name};
          }
          db.execute(query)
        end
      end

      it 'validates view scope' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
          ["datasets:r:#{@view_name}"],
          @user
        )
        expect(scopes).to be_empty
      end

      it 'validates materialized view scope' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
          ["datasets:r:#{@materialized_view_name}"],
          @user
        )
        expect(scopes).to be_empty
      end
    end

    # org schemas
    describe 'org schemas' do
      it 'validates own user schema' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
          ["schemas:c:#{@carto_org_user_2.database_schema}"], @carto_org_user_2
        )
        expect(scopes).to be_empty
      end

      it 'returns scopes for other user schema' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
          ["schemas:c:#{@carto_org_user_1.database_schema}"], @carto_org_user_2
        )
        expect(scopes).to eq(
          [
            "schemas:c:#{@carto_org_user_1.database_schema}"
          ]
        )
      end

      it 'returns scopes for same org users schemas' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
          [
            "schemas:c:#{@carto_org_user_1.database_schema}",
            "schemas:c:#{@carto_org_user_2.database_schema}",
            "schemas:c:#{@carto_org_user_owner.database_schema}"
          ], @carto_org_user_2
        )
        expect(scopes).to eq(
          [
            "schemas:c:#{@carto_org_user_1.database_schema}",
            "schemas:c:#{@carto_org_user_owner.database_schema}"
          ]
        )
      end

      it 'returns scopes for non-user org schema' do
        @helper = TestUserFactory.new
        @org_user_owner2 = @helper.create_owner(@organization_2)

        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
          [
            "schemas:c:#{@carto_org_user_1.database_schema}",
            "schemas:c:#{@carto_org_user_2.database_schema}",
            "schemas:c:#{@org_user_owner2.database_schema}"
          ], @carto_org_user_2
        )
        expect(scopes).to eq(
          [
            "schemas:c:#{@carto_org_user_1.database_schema}",
            "schemas:c:#{@org_user_owner2.database_schema}"
          ]
        )
      end
    end

    describe 'shared datasets' do
      before :each do
        @shared_table = create_table(user_id: @carto_org_user_1.id)
        not_shared_table = create_table(user_id: @carto_org_user_1.id)

        perm = @shared_table.table_visualization.permission
        perm.acl = [{ type: 'user', entity: { id: @org_user_2.id }, access: 'r' }]
        perm.save!

        @shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{@shared_table.name}"
        @non_shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{not_shared_table.name}"
      end

      it 'validates shared dataset' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables([@shared_dataset_scope], @carto_org_user_2)
        expect(scopes).to be_empty
      end

      it 'returns non shared dataset' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables([@non_shared_dataset_scope], @carto_org_user_2)
        expect(scopes).to eq([@non_shared_dataset_scope])
      end

      it 'returns only non shared dataset' do
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
          [@shared_dataset_scope, @non_shared_dataset_scope],
          @carto_org_user_2
        )
        expect(scopes).to eq([@non_shared_dataset_scope])
      end

      it 'should fail write scope in shared dataset with only read perms' do
        rw_scope = "datasets:rw:#{@carto_org_user_1.database_schema}.#{@shared_table.name}"
        scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables([rw_scope], @carto_org_user_2)
        expect(scopes).to eq([rw_scope])
      end

      describe 'organization shared datasets' do
        before :each do
          @org_shared_table = create_table(user_id: @carto_org_user_1.id)
          non_org_shared_table = create_table(user_id: @carto_org_user_1.id)

          perm = @org_shared_table.table_visualization.permission
          perm.acl = [
            {
              type: Permission::TYPE_ORGANIZATION,
              entity: { id: @carto_organization.id },
              access: Permission::ACCESS_READONLY
            }
          ]
          perm.save!

          @org_shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{@org_shared_table.name}"
          @non_org_shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{non_org_shared_table.name}"
        end

        it 'validates org shared dataset' do
          scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
            [@org_shared_dataset_scope],
            @carto_org_user_2
          )
          expect(scopes).to be_empty
        end

        it 'returns non org shared dataset' do
          scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
            [@non_org_shared_dataset_scope],
            @carto_org_user_2
          )
          expect(scopes).to eq([@non_org_shared_dataset_scope])
        end

        it 'returns only non org shared dataset' do
          scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables(
            [@org_shared_dataset_scope, @non_org_shared_dataset_scope],
            @carto_org_user_2
          )
          expect(scopes).to eq([@non_org_shared_dataset_scope])
        end

        it 'should fail write scope in org shared dataset with only read perms' do
          rw_scope = "datasets:rw:#{@carto_org_user_1.database_schema}.#{@org_shared_table.name}"
          scopes = Carto::OauthProvider::Scopes.invalid_scopes_and_tables([rw_scope], @carto_org_user_2)
          expect(scopes).to eq([rw_scope])
        end
      end
    end
  end

  describe Carto::OauthProvider::Scopes::DataservicesScope do
    describe '#add_to_api_key_grants' do
      let(:scope) { Carto::OauthProvider::Scopes::DataservicesScope.new('geocoding', 'GC') }

      it 'adds SQL api and dataservice' do
        grants = [{ type: 'apis', apis: [] }]
        scope.add_to_api_key_grants(grants, nil)
        expect(grants).to(eq([{ type: 'apis', apis: ['sql'] }, { type: 'dataservices', services: ['geocoding'] }]))
      end

      it 'does not add duplicate SQL api' do
        grants = [{ type: 'apis', apis: ['sql'] }]
        scope.add_to_api_key_grants(grants, nil)
        expect(grants).to(include(type: 'apis', apis: ['sql']))
      end
    end
  end

  describe Carto::OauthProvider::Scopes::UserScope do
    describe '#add_to_api_key_grants' do
      let(:scope) { Carto::OauthProvider::Scopes::UserScope.new('profile', 'User public profile') }

      it 'adds user scope with profile subset' do
        grants = [{ type: 'apis', apis: [] }]
        scope.add_to_api_key_grants(grants, nil)
        expect(grants).to(eq([{ type: 'apis', apis: [] }, { type: 'user', data: ['profile'] }]))
      end
    end
  end

  describe Carto::OauthProvider::Scopes::DatasetsScope do
    describe '#add_to_api_key_grants' do
      let(:full_dataset_scope) { Carto::OauthProvider::Scopes::DatasetsScope.new('datasets:rw:untitled_table') }
      let(:read_dataset_scope) { Carto::OauthProvider::Scopes::DatasetsScope.new('datasets:r:untitled_table') }
      let(:schema_scope) { Carto::OauthProvider::Scopes::SchemasScope.new('schemas:c') }
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
    end
  end

  describe '#subtract_scopes' do
    it 'r - r' do
      scopes1 = ['datasets:r:schema.table']
      scopes2 = ['datasets:r:schema.table']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to be_empty
    end

    it 'r - rw' do
      scopes1 = ['datasets:r:schema.table']
      scopes2 = ['datasets:rw:schema.table']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to be_empty
    end

    it 'empties' do
      scopes1 = []
      scopes2 = []
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to be_empty
    end

    it 'rw - r' do
      scopes1 = ['datasets:rw:schema.table']
      scopes2 = ['datasets:r:schema.table']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to(eq(scopes1))
    end

    it 'rw - rw' do
      scopes1 = ['datasets:rw:schema.table']
      scopes2 = ['datasets:rw:schema.table']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to be_empty
    end

    it 'table1 - table2' do
      scopes1 = ['datasets:rw:schema.table1']
      scopes2 = ['datasets:rw:schema.table2']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to(eq(scopes1))
    end

    it 'table - empty' do
      scopes1 = ['datasets:rw:schema.table']
      scopes2 = []
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to(eq(scopes1))
    end

    it 'empty - table' do
      scopes1 = []
      scopes2 = ['datasets:rw:schema.table']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to be_empty
    end

    it '(rw & profile) - r' do
      scopes1 = ['datasets:rw:schema.table', 'user:profile']
      scopes2 = ['datasets:r:schema.table']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to(eq(scopes1))
    end

    it 'profile - profile' do
      scopes1 = ['user:profile']
      scopes2 = ['user:profile']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to be_empty
    end

    it 'schema - schena' do
      scopes1 = ['schemas:c']
      scopes2 = ['schemas:c']
      scopes = Carto::OauthProvider::Scopes.subtract_scopes(scopes1, scopes2, nil)
      expect(scopes).to be_empty
    end
  end

  describe '#scopes_by_category' do
    include Carto::OauthProvider::Scopes
    before :all do
      @user = Carto::User.find(create_user.id)
      @table = FactoryGirl.create(:carto_user_table, :with_db_table, user_id: @user.id)
    end

    after :all do
      @table.destroy
      @user.destroy
    end

    it 'read-write permission having no one' do
      new_scopes = ["datasets:rw:#{@table.name}"]
      previous_scopes = []
      expected = [
        {
          description: "User and personal data",
          icon: nil,
          scopes: [{ description: "Username and organization name", new: true }]
        },
        {
          description: "Access to your datasets",
          icon: nil,
          scopes: [{ description: "#{@table.name} (read/write access)", new: true }]
        }
      ]

      scopes_by_category = Carto::OauthProvider::Scopes.scopes_by_category(new_scopes, previous_scopes)
      expect(scopes_by_category).to(eq(expected))
    end

    it 'read permission having read-write' do
      new_scopes = ["datasets:r:#{@table.name}"]
      previous_scopes = ["datasets:rw:#{@table.name}"]
      expected = [
        {
          description: "User and personal data",
          icon: nil,
          scopes: [{ description: "Username and organization name", new: false }]
        },
        {
          description: "Access to your datasets",
          icon: nil,
          scopes: [{ description: "#{@table.name} (read/write access)", new: false }]
        }
      ]

      scopes_by_category = Carto::OauthProvider::Scopes.scopes_by_category(new_scopes, previous_scopes)
      expect(scopes_by_category).to(eq(expected))
    end

    it 'read-write permission having read-write' do
      new_scopes = ["datasets:rw:#{@table.name}"]
      previous_scopes = ["datasets:rw:#{@table.name}"]
      expected = [
        {
          description: "User and personal data",
          icon: nil,
          scopes: [{ description: "Username and organization name", new: false }]
        },
        {
          description: "Access to your datasets",
          icon: nil,
          scopes: [{ description: "#{@table.name} (read/write access)", new: false }]
        }
      ]

      scopes_by_category = Carto::OauthProvider::Scopes.scopes_by_category(new_scopes, previous_scopes)
      expect(scopes_by_category).to(eq(expected))
    end

    it 'read-write permission having read' do
      new_scopes = ["datasets:rw:#{@table.name}"]
      previous_scopes = ["datasets:r:#{@table.name}"]
      expected = [
        {
          description: "User and personal data",
          icon: nil,
          scopes: [{ description: "Username and organization name", new: false }]
        },
        {
          description: "Access to your datasets",
          icon: nil,
          scopes: [{ description: "#{@table.name} (read/write access)", new: true }]
        }
      ]

      scopes_by_category = Carto::OauthProvider::Scopes.scopes_by_category(new_scopes, previous_scopes)
      expect(scopes_by_category).to(eq(expected))
    end

    it 'shows create table permission' do
      create_scope = ["schemas:c:public"]
      expected = [
        {
          description: "User and personal data",
          icon: nil,
          scopes: [{ description: "Username and organization name", new: true }]
        },
        {
          description: "Create tables",
          icon: nil,
          scopes: [{ description: "public schema (create tables)", new: true }]
        }
      ]

      scopes_by_category = Carto::OauthProvider::Scopes.scopes_by_category(create_scope, [])
      expect(scopes_by_category).to(eq(expected))
    end
  end
end

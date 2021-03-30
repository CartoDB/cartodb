require 'spec_helper_unit'
require 'helpers/database_connection_helper'

module Carto
  describe OauthAccessToken do
    include DatabaseConnectionHelper

    before do
      @organization = create(:organization_with_users)
      @org_user_1 = @organization.users.first
      @org_user_2 = @organization.users.second
    end

    describe '#validation' do
      before do
        @user = create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
        @app = create(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.create!(user: @carto_user, oauth_app: @app)
        @user_table = create(:carto_user_table, :with_db_table, user_id: @carto_user.id)
      end

      it 'does not accept invalid scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['wadus'])
        expect(access_token).to_not(be_valid)
        expect(access_token.errors[:scopes]).to(include("contains unsupported scopes: wadus"))
      end

      it 'does accept create tables in schema scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ["schemas:c"])
        expect(access_token).to(be_valid)
      end

      it 'does accept read datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ["datasets:r:#{@user_table.name}"])
        expect(access_token).to(be_valid)
      end

      it 'does accept read and write datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ["datasets:rw:#{@user_table.name}"])
        expect(access_token).to(be_valid)
      end

      it 'does not accept invalid permission in datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['datasets:f:wadus'])
        expect(access_token).to_not(be_valid)
      end

      it 'does not validate tables existence on datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['datasets:r:wadus'])
        expect(access_token).to(be_valid)
      end

      it 'does not validate schemas existence on datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['schemas:c:wadus'])
        expect(access_token).to(be_valid)
      end

      it 'does not accept invalid datasets scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['datasets:f'])
        expect(access_token).to_not(be_valid)
      end

      it 'does not accept invalid schema scopes' do
        access_token = OauthAccessToken.new(oauth_app_user: @app_user, scopes: ['schemas:f'])
        expect(access_token).to_not(be_valid)
      end

      it 'auto generates api_key' do
        access_token = OauthAccessToken.create!(oauth_app_user: @app_user)
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
      end

      it 'api key includes permissions for requested scopes' do
        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: ['dataservices:geocoding', 'user:profile'])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(include(type: 'apis', apis: ['sql']))
        expect(access_token.api_key.grants).to(include(type: 'dataservices', services: ['geocoding']))
        expect(access_token.api_key.grants).to(include(type: 'user', data: ['profile']))
      end

      it 'raises an error when creating an api key for an non-existent dataset' do
        expect {
          OauthAccessToken.create!(oauth_app_user: @app_user,
                                   scopes: ['datasets:r:wadus'])
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'raises an error when creating an api key for an non-existent dataset' do
        expect {
          OauthAccessToken.create!(oauth_app_user: @app_user,
                                   scopes: ['schemas:c:wadus'])
        }.to raise_error(ActiveRecord::RecordInvalid)
      end

      it 'includes create permission for schemas scopes' do
        create(:carto_user_table, :with_db_table, user_id: @user.id)
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['sql']
            },
            {
              type: 'database',
              schemas: [
                {
                  name: 'public',
                  permissions: ['create']
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: ['schemas:c'])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'includes listing metadata permission for datasets scopes' do
        create(:carto_user_table, :with_db_table, user_id: @user.id)
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['sql']
            },
            {
              type: 'database',
              table_metadata: []
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user, scopes: ['datasets:metadata'])

        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'api key includes read permissions for datasets scopes' do
        user_table = create(:carto_user_table, :with_db_table, user_id: @user.id)
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: user_table.name,
                  permissions: ['select'],
                  schema: 'public'
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: ["datasets:r:#{user_table.name}"])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'api key includes read-write permissions for datasets scopes' do
        user_table = create(:carto_user_table, :with_db_table, user_id: @user.id)
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: user_table.name,
                  permissions: ['select', 'insert', 'update', 'delete'],
                  schema: 'public'
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: ["datasets:rw:#{user_table.name}"])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'api key includes permissions for several datasets scopes' do
        user_table = create(:carto_user_table, :with_db_table, user_id: @user.id)
        user_table2 = create(:carto_user_table, :with_db_table, user_id: @user.id)
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: user_table.name,
                  permissions: ['select'],
                  schema: 'public'
                },
                {
                  name: user_table2.name,
                  permissions: ['select', 'insert', 'update', 'delete'],
                  schema: 'public'
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: [
                                                  "datasets:r:#{user_table.name}",
                                                  "datasets:rw:#{user_table2.name}"
                                                ])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'includes service account permission for user scopes' do
        create(:carto_user_table, :with_db_table, user_id: @user.id)
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['do']
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user, scopes: ['apis:do'])

        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end
    end

    describe 'cdb_conf_info' do
      before do
        @user = create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
        @app = create(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.create!(user: @carto_user, oauth_app: @app)
        @user_table = create(:carto_user_table, :with_db_table, user_id: @carto_user.id)
        @db_role = Carto::DB::Sanitize.sanitize_identifier("carto_role_#{SecureRandom.hex}")
        Carto::ApiKey.any_instance.stubs(:db_role).returns(@db_role)
      end

      it 'saves ownership_role_name in cdb_conf_info if schemas granted' do
        Carto::ApiKey.any_instance.expects(:cdb_conf_info)
                     .returns(username: @app_user.user.username,
                              permissions: [],
                              ownership_role_name: @app_user.ownership_role_name)
                     .at_least_once
        OauthAccessToken.create!(oauth_app_user: @app_user,
                                 scopes: [
                                   "schemas:c"
                                 ])
      end

      it 'does not save ownership_role_name in cdb_conf_info if schemas not granted' do
        Carto::ApiKey.any_instance.expects(:cdb_conf_info)
                     .returns(username: @app_user.user.username,
                              permissions: [],
                              ownership_role_name: '')
                     .at_least_once
        OauthAccessToken.create!(oauth_app_user: @app_user,
                                 scopes: [
                                   "datasets:r:#{@user_table.name}"
                                 ])
      end
    end

    describe '#shared datasets' do
      before do
        @app = create(:oauth_app, user: @org_user_1)
        @app_user = OauthAppUser.create!(user: @org_user_2, oauth_app: @app)
        @shared_table = create_table(user_id: @org_user_1.id)
        @not_shared_table = create_table(user_id: @org_user_1.id)

        perm = @shared_table.table_visualization.permission
        perm.acl = [{ type: 'user', entity: { id: @org_user_2.id }, access: 'rw' }]
        perm.save!

        @shared_dataset_scope = "datasets:rw:#{@org_user_1.database_schema}.#{@shared_table.name}"
        @non_shared_dataset_scope = "datasets:rw:#{@org_user_1.database_schema}.#{@not_shared_table.name}"
      end

      it 'works with shared dataset' do
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: @shared_table.name,
                  permissions: ['select', 'insert', 'update', 'delete'],
                  schema: @org_user_1.database_schema
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user, scopes: [@shared_dataset_scope])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("select count(1) from #{@org_user_1.database_schema}.#{@shared_table.name}")
        end
      end

      it 'should fail with non shared dataset' do
        expect {
          OauthAccessToken.create!(oauth_app_user: @app_user, scopes: [@non_shared_dataset_scope])
        }.to raise_error(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
      end

      it 'should fail with non shared schema' do
        expect {
          OauthAccessToken.create!(oauth_app_user: @app_user, scopes: ['schemas:c:non_existent'])
        }.to raise_error(ActiveRecord::RecordInvalid, /can only grant schema permissions you have/)
      end

      it 'should fail with shared and non shared dataset' do
        expect {
          OauthAccessToken.create!(
            oauth_app_user: @app_user,
            scopes: [@shared_dataset_scope, @non_shared_dataset_scope]
          )
        }.to raise_error(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
      end

      describe 'read - write permissions' do
        before do
          @only_read_table = create_table(user_id: @org_user_1.id)

          perm = @only_read_table.table_visualization.permission
          perm.acl = [{ type: 'user', entity: { id: @org_user_2.id }, access: 'r' }]
          perm.save!
        end

        it 'should fail write scope in shared dataset with only read perms' do
          rw_scope = "datasets:rw:#{@org_user_1.database_schema}.#{@only_read_table.name}"
          expect {
            OauthAccessToken.create!(oauth_app_user: @app_user, scopes: [rw_scope])
          }.to raise_error(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
        end
      end
    end

    describe 'organization shared datasets' do
      before do
        @app = create(:oauth_app, user: @org_user_1)
        @app_user = OauthAppUser.create!(user: @org_user_2, oauth_app: @app)
        @org_shared_table = create_table(user_id: @org_user_1.id)
        @non_org_shared_table = create_table(user_id: @org_user_1.id)

        perm = @org_shared_table.table_visualization.permission
        perm.acl = [
          {
            type: Carto::Permission::TYPE_ORGANIZATION,
            entity: { id: @organization.id },
            access: Carto::Permission::ACCESS_READWRITE
          }
        ]
        perm.save!

        @org_shared_dataset_scope = "datasets:rw:#{@org_user_1.database_schema}.#{@org_shared_table.name}"
        @non_org_shared_dataset_scope = "datasets:rw:#{@org_user_1.database_schema}.#{@non_org_shared_table.name}"
      end

      it 'works with shared dataset' do
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: @org_shared_table.name,
                  permissions: ['select', 'insert', 'update', 'delete'],
                  schema: @org_user_1.database_schema
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user, scopes: [@org_shared_dataset_scope])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'works with shared schema' do
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['sql']
            },
            {
              type: 'database',
              schemas: [
                {
                  name: @org_user_2.database_schema,
                  permissions: ['create']
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user,
                                                scopes: ["schemas:c:#{@org_user_2.database_schema}"])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'should fail with non shared dataset' do
        expect {
          OauthAccessToken.create!(oauth_app_user: @app_user, scopes: [@non_org_shared_dataset_scope])
        }.to raise_error(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
      end

      it 'should fail with non shared schema' do
        expect {
          OauthAccessToken.create!(oauth_app_user: @app_user,
                                   scopes: ["schemas:c:wadus"])
        }.to raise_error(ActiveRecord::RecordInvalid, /can only grant schema permissions you have/)
      end

      it 'should fail with shared and non shared dataset' do
        expect {
          OauthAccessToken.create!(
            oauth_app_user: @app_user,
            scopes: [@org_shared_dataset_scope, @non_org_shared_dataset_scope]
          )
        }.to raise_error(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
      end

      describe 'read - write permissions' do
        before do
          @only_read_table = create_table(user_id: @org_user_1.id)

          perm = @only_read_table.table_visualization.permission
          perm.acl = [
            {
              type: Carto::Permission::TYPE_ORGANIZATION,
              entity: { id: @organization.id },
              access: Carto::Permission::ACCESS_READONLY
            }
          ]
          perm.save!
        end

        it 'should fail write scope in shared dataset with only read perms' do
          rw_scope = "datasets:rw:#{@org_user_1.database_schema}.#{@only_read_table.name}"
          expect {
            OauthAccessToken.create!(oauth_app_user: @app_user, scopes: [rw_scope])
          }.to raise_error(ActiveRecord::RecordInvalid, /can only grant table permissions you have/)
        end
      end
    end

    describe 'views' do
      before do
        @user = create(:valid_user)
        @carto_user = @user.carto_user
        @user_table = create_table(user_id: @carto_user.id)
        @view_name = "#{@user_table.name}_view"
        @materialized_view_name = "#{@user_table.name}_matview"
        @carto_user.in_database do |db|
          query = %{
            CREATE VIEW #{@view_name} AS SELECT * FROM #{@user_table.name};
            CREATE MATERIALIZED VIEW #{@materialized_view_name} AS SELECT * FROM #{@user_table.name};
          }
          db.execute(query)
        end
        @app = create(:oauth_app, user: @carto_user)
        @app_user = OauthAppUser.create!(user: @carto_user, oauth_app: @app)
      end

      it 'validates view scope' do
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: @view_name,
                  permissions: ['select', 'insert', 'update', 'delete'],
                  schema: @carto_user.database_schema
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(oauth_app_user: @app_user, scopes: ["datasets:rw:#{@view_name}"])
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end

      it 'validates materialized view scope' do
        expected_grants =
          [
            {
              type: 'apis',
              apis: ['maps', 'sql']
            },
            {
              type: 'database',
              tables: [
                {
                  name: @materialized_view_name,
                  permissions: ['select', 'insert', 'update', 'delete'],
                  schema: @carto_user.database_schema
                }
              ]
            }
          ]

        access_token = OauthAccessToken.create!(
          oauth_app_user: @app_user,
          scopes: ["datasets:rw:#{@materialized_view_name}"]
        )
        expect(access_token.api_key).to(be)
        expect(access_token.api_key.type).to(eq('oauth'))
        expect(access_token.api_key.grants).to(eq(expected_grants))
      end
    end
  end
end

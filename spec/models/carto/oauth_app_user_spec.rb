require 'spec_helper_unit'
require 'helpers/database_connection_helper'

module Carto
  describe OauthAppUser do
    include CartoDB::Factories
    include DatabaseConnectionHelper

    let(:organization_owner) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
    let(:organization) { create(:organization, :with_owner, owner: organization_owner) }
    let(:organization_user_1) { organization.users.first }
    let(:organization_user_2) do
      create(:carto_user, organization_id: organization.id, factory_bot_context: { only_db_setup: true })
    end
    let(:user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
    let(:app) { create(:oauth_app, user: user) }

    describe 'validation' do
      it 'requires user' do
        app_user = described_class.new
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:user]).to(include("can't be blank"))
      end

      it 'requires oauth app_user' do
        app_user = described_class.new
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:oauth_app]).to(include("can't be blank"))
      end

      it 'does not allow duplicates' do
        described_class.create!(user: user, oauth_app: app)
        app_user2 = described_class.new(user: user, oauth_app: app)
        expect(app_user2).to_not(be_valid)
        expect(app_user2.errors[:user]).to(include("has already been taken"))
      end

      it 'does not accept invalid scopes' do
        app_user = described_class.new(scopes: ['wadus'])
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:scopes]).to(include("contains unsupported scopes: wadus"))
      end

      it 'validates' do
        app_user = described_class.new(user: user, oauth_app: app)
        expect(app_user).to(be_valid)
      end

      describe 'restricted app' do
        before do
          app.update!(restricted: true)
          app.oauth_app_organizations.create!(organization: organization, seats: 1)
        end

        it 'does not accept non-organization users' do
          app_user = OauthAppUser.new(user: user, oauth_app: app)
          expect(app_user).not_to(be_valid)
          expect(app_user.errors[:user]).to(include("is not part of an organization"))
        end

        it 'does not accept users from unknown organizations' do
          other_organization = create(:organization_with_users)
          app.oauth_app_organizations.each(&:destroy!)
          app.oauth_app_organizations.create!(organization: other_organization, seats: 1)

          app_user = OauthAppUser.new(user: organization_user_1, oauth_app: app)
          expect(app_user).not_to(be_valid)
          expect(app_user.errors[:user]).to(include("is part of an organization which is not allowed access to this application"))
        end

        it 'accepts users from the authorized organization' do
          app_user = OauthAppUser.new(user: organization_user_1, oauth_app: app)
          expect(app_user).to(be_valid)
        end

        it 'does not accepts users over the seat limit' do
          OauthAppUser.create!(user: organization_user_1, oauth_app: app)
          app_user = OauthAppUser.new(user: organization_user_2, oauth_app: app)
          expect(app_user).not_to(be_valid)
          expect(app_user.errors[:user]).to(include("does not have an available seat to use this application"))
        end
      end
    end

    describe '#authorized?' do
      before do
        @t1 = create_table(user_id: user.id)
        @t2 = create_table(user_id: user.id)
      end

      it 'is authorized only if all requested scopes are already granted' do
        o1 = "datasets:rw:#{user.database_schema}.#{@t1.name}"
        o2 = "datasets:rw:#{user.database_schema}.#{@t2.name}"
        o3 = "schemas:c:#{user.database_schema}"

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: [o1, o2, o3])

        expect(oau).to(be_authorized([o1]))
        expect(oau).to(be_authorized([o2]))
        expect(oau).to(be_authorized([o3]))
        expect(oau).to(be_authorized([o1, o2, o3]))

        expect(oau).not_to(be_authorized(['not_allowed']))
        expect(oau).not_to(be_authorized([o1, 'not_allowed']))
      end

      it 'should be authorized if requesting read permission having read-write' do
        write_read = "datasets:rw:#{@t1.name}"
        read = "datasets:r:#{@t1.name}"

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: [write_read])

        expect(oau).to(be_authorized([read]))
      end

      it 'should NOT be authorized if requesting read-write permission having only read' do
        write_read = "datasets:rw:#{@t1.name}"
        read = "datasets:r:#{@t1.name}"

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: [read])

        expect(oau).not_to(be_authorized([write_read]))
      end
    end

    describe '#upgrade!' do
      before do
        @t1 = create_table(user_id: user.id)
        @t2 = create_table(user_id: user.id)
        @t3 = create_table(user_id: user.id)
        @t4 = create_table(user_id: user.id)
      end

      it 'grants all new scopes without duplicates' do
        o1 = "datasets:rw:#{@t1.name}"
        o2 = "datasets:rw:#{@t2.name}"
        o3 = "datasets:rw:#{@t3.name}"
        o4 = "datasets:rw:#{@t4.name}"
        o5 = "schemas:c:#{user.database_schema}"

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: [o1, o2])

        oau.upgrade!([])
        expect(oau.scopes).to(match_array([o1, o2]))

        oau.upgrade!([o1])
        expect(oau.scopes).to(match_array([o1, o2]))

        oau.upgrade!([o3])
        expect(oau.scopes).to(match_array([o1, o2, o3]))

        oau.upgrade!([o2, o4])
        expect(oau.scopes).to(match_array([o1, o2, o3, o4]))

        oau.upgrade!([])
        expect(oau.scopes).to(match_array([o1, o2, o3, o4]))

        oau.upgrade!([o5])
        expect(oau.scopes).to(match_array([o1, o2, o3, o4, o5]))
      end
    end

    describe 'datasets scope' do
      before do
        @table1 = create_table(user_id: user.id)
      end

      it 'creation and update' do
        table2 = create_table(user_id: user.id)
        dataset_scope1 = "datasets:rw:#{@table1.name}"
        dataset_scope2 = "datasets:r:#{table2.name}"
        scopes = ['user:profile', dataset_scope1, dataset_scope2]

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
        expect(oau.scopes).to(match_array(scopes))

        oau.upgrade!([])
        expect(oau.scopes).to(match_array(scopes))

        oau.upgrade!([dataset_scope1])
        expect(oau.scopes).to(match_array(scopes))

        table2.destroy
        oau.destroy
      end

      it 'rename table and check how it affects the scopes' do
        scopes_before = ['user:profile', "datasets:rw:#{@table1.name}"]
        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes_before)
        expect(oau.all_scopes).to(match_array(scopes_before))

        @table1.name = 'table_renamed_' + @table1.name
        @table1.save

        expect(oau.all_scopes).to_not(match_array(scopes_before))

        scopes_after = ['user:profile', "datasets:rw:#{@table1.name}"]
        expect(oau.all_scopes).to(match_array(scopes_after))

        oau.destroy
      end

      it 'write on table with the proper permissions' do
        scopes_before = ['user:profile', "datasets:rw:#{@table1.name}"]
        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes_before)
        expect(oau.all_scopes).to(match_array(scopes_before))
        access_token = OauthAccessToken.create!(oauth_app_user: oau, scopes: scopes_before)

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("insert into #{@table1.name} (cartodb_id) values (999)")
          connection.execute("select cartodb_id from #{@table1.name}") do |result|
            result[0]['cartodb_id'].should eq '999'
          end
        end

        oau.destroy
      end

      it 'should fail if we change the write permissions and we try to write in the table' do
        scopes_before = ['offline', 'user:profile', "datasets:rw:#{@table1.name}"]
        scopes_after = ['offline', 'user:profile']
        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes_before)
        expect(oau.all_scopes).to(match_array(scopes_before))
        refresh_token = oau.oauth_refresh_tokens.create!(scopes: scopes_before)
        access_token = refresh_token.exchange!(requested_scopes: scopes_before)[0]

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("insert into #{@table1.name} (cartodb_id) values (999)")
          connection.execute("select cartodb_id from #{@table1.name}") do |result|
            result[0]['cartodb_id'].should eq '999'
          end
        end

        access_token_new = refresh_token.exchange!(requested_scopes: scopes_after)[0]
        expect(access_token.api_key.db_role).to_not(eq(access_token_new.api_key.db_role))
        with_connection_from_api_key(access_token_new.api_key) do |connection|
          expect {
            connection.execute("insert into #{@table1.name} (cartodb_id) values (1000)")
          }.to raise_exception(Sequel::DatabaseError, /permission denied for (relation|table) #{@table1.name}/)
        end

        oau.destroy
      end

      it 'should let downgrade scope for datasets from rw to r scope' do
        scopes_before = ['offline', 'user:profile', "datasets:rw:#{@table1.name}"]
        scopes_after = ['offline', 'user:profile', "datasets:r:#{@table1.name}"]
        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes_before)
        expect(oau.all_scopes).to(match_array(scopes_before))
        refresh_token = oau.oauth_refresh_tokens.create!(scopes: scopes_before)
        access_token = refresh_token.exchange!(requested_scopes: scopes_before)[0]

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("insert into #{@table1.name} (cartodb_id) values (999)")
          connection.execute("select cartodb_id from #{@table1.name}") do |result|
            result[0]['cartodb_id'].should eq '999'
          end
        end

        access_token_new = refresh_token.exchange!(requested_scopes: scopes_after)[0]
        expect(access_token.api_key.db_role).to_not(eq(access_token_new.api_key.db_role))
        with_connection_from_api_key(access_token_new.api_key) do |connection|
          connection.execute("select cartodb_id from #{@table1.name}") do |result|
            result[0]['cartodb_id'].should eq '999'
          end
          expect {
            connection.execute("insert into #{@table1.name} (cartodb_id) values (999)")
          }.to raise_exception(Sequel::DatabaseError, /permission denied for (relation|table) #{@table1.name}/)
        end

        oau.destroy
      end

    end

    describe 'schemas scope' do
      before do
        @table1 = create_table(user_id: user.id)
        @table2 = create_table(user_id: user.id)
      end

      it 'creation and update' do
        table2 = create_table(user_id: user.id)
        dataset_scope1 = "datasets:rw:#{@table1.name}"
        dataset_scope2 = "datasets:r:#{table2.name}"
        scopes = ['user:profile', dataset_scope1, dataset_scope2]

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
        expect(oau.scopes).to(match_array(scopes))

        oau.upgrade!([])
        expect(oau.scopes).to(match_array(scopes))

        oau.upgrade!([dataset_scope1])
        expect(oau.scopes).to(match_array(scopes))

        table2.destroy
        oau.destroy
      end

      it 'create table with permissions should work and assign it to the owner_role' do
        schemas_scope = "schemas:c"
        scopes = ['user:profile', schemas_scope]

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
        expect(oau.scopes).to(match_array(scopes))
        access_token = OauthAccessToken.create!(oauth_app_user: oau, scopes: scopes)

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("create table test_table as select 1 as test")
          connection.execute("select count(1) from test_table") do |result|
            result[0]['count'].should eq '1'
          end
          connection.execute("select pg_catalog.pg_get_userbyid(relowner) as owner from pg_class where relname = 'test_table'") do |result|
            result[0]['owner'].should eq oau.ownership_role_name
          end
          connection.execute("drop table test_table")
        end

        oau.destroy
      end

      it 'create table without permissions should fail' do
        scopes = ['user:profile']

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
        expect(oau.scopes).to(match_array(scopes))
        access_token = OauthAccessToken.create!(oauth_app_user: oau, scopes: scopes)

        with_connection_from_api_key(access_token.api_key) do |connection|
          expect {
            connection.execute("create table test_table as select 1 as test")
          }.to raise_exception(Sequel::DatabaseError, /permission denied for schema public/)
        end

        oau.destroy
      end

      it 'create table with permission, then refresh token and drop the table with the new db role' do
        schemas_scope = "schemas:c"
        scopes = ['offline', 'user:profile', schemas_scope]

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
        expect(oau.scopes).to(match_array(scopes))
        refresh_token = oau.oauth_refresh_tokens.create!(scopes: scopes)
        access_token = refresh_token.exchange!(requested_scopes: scopes)[0]

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("create table test_table as select 1 as test")
          connection.execute("select count(1) from test_table") do |result|
            result[0]['count'].should eq '1'
          end
          connection.execute("select pg_catalog.pg_get_userbyid(relowner) as owner from pg_class where relname = 'test_table'") do |result|
            result[0]['owner'].should eq oau.ownership_role_name
          end
        end

        access_token_new = refresh_token.exchange!(requested_scopes: scopes)[0]
        expect(access_token.api_key.db_role).to_not(eq(access_token_new.api_key.db_role))
        with_connection_from_api_key(access_token_new.api_key) do |connection|
          connection.execute("drop table test_table")
        end

        oau.destroy
      end

      it 'create table with permission, then refresh token and remove permission, then try to create another table and get exception' do
        schemas_scope = "schemas:c"
        scopes = ['offline', 'user:profile', schemas_scope]

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
        expect(oau.scopes).to(match_array(scopes))
        refresh_token = oau.oauth_refresh_tokens.create!(scopes: scopes)
        access_token = refresh_token.exchange!(requested_scopes: scopes)[0]

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("create table test_table as select 1 as test")
          connection.execute("select count(1) from test_table") do |result|
            result[0]['count'].should eq '1'
          end
          connection.execute("select pg_catalog.pg_get_userbyid(relowner) as owner from pg_class where relname = 'test_table'") do |result|
            result[0]['owner'].should eq oau.ownership_role_name
          end
          connection.execute("drop table test_table")
        end

        access_token_new = refresh_token.exchange!(requested_scopes: ['offline', 'user:profile'])[0]
        expect(access_token.api_key.db_role).to_not(eq(access_token_new.api_key.db_role))
        with_connection_from_api_key(access_token_new.api_key) do |connection|
          expect {
            connection.execute("create table test_table_without_permissions as select 1 as test")
          }.to raise_exception(Sequel::DatabaseError, /permission denied for schema public/)
        end

        oau.destroy
      end

      it 'master role can drop tables created with access token API key' do
        schemas_scope = "schemas:c"
        scopes = ['offline', 'user:profile', schemas_scope]

        oau = OauthAppUser.create!(user: user, oauth_app: app, scopes: scopes)
        expect(oau.scopes).to(match_array(scopes))
        refresh_token = oau.oauth_refresh_tokens.create!(scopes: scopes)
        access_token = refresh_token.exchange!(requested_scopes: scopes)[0]

        with_connection_from_api_key(access_token.api_key) do |connection|
          connection.execute("create table test_table as select 1 as test")
          connection.execute("select count(1) from test_table") do |result|
            result[0]['count'].should eq '1'
          end
        end

        with_connection_from_api_key(user.api_keys.master.first) do |connection|
          connection.execute("drop table test_table")
          connection.execute("select * from pg_class where relname = 'test_table'") do |result|
            result.count.should eq 0
          end
        end
      end
    end

    describe 'shared datasets' do
      let(:app) { create(:oauth_app, user: organization_user_1) }

      before do
        @shared_table = create_table(user_id: organization_user_1.id)
        not_shared_table = create_table(user_id: organization_user_1.id)

        perm = @shared_table.table_visualization.permission
        perm.acl = [{ type: 'user', entity: { id: organization_user_2.id }, access: 'rw' }]
        perm.save!

        @shared_dataset_scope = "datasets:r:#{organization_user_1.database_schema}.#{@shared_table.name}"
        @non_shared_dataset_scope = "datasets:r:#{organization_user_1.database_schema}.#{not_shared_table.name}"
      end

      it 'works with shared dataset' do
        oau = OauthAppUser.create!(user: organization_user_2, oauth_app: app, scopes: [@shared_dataset_scope])
        expect(oau.all_scopes).to(eq([@shared_dataset_scope]))
      end

      it 'should fail with non shared dataset' do
        expect {
          OauthAppUser.create!(user: organization_user_2, oauth_app: app, scopes: [@non_shared_dataset_scope])
        }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
      end

      it 'should fail with shared and non shared dataset' do
        expect {
          OauthAppUser.create!(
            user: organization_user_2,
            oauth_app: app,
            scopes: [@shared_dataset_scope, @non_shared_dataset_scope]
          )
        }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
      end

      it 'should revoke permissions removing shared permissions' do
        oau = OauthAppUser.create!(user: organization_user_2, oauth_app: app, scopes: [@shared_dataset_scope])
        expect(oau.all_scopes).to(eq([@shared_dataset_scope]))

        expect(oau.authorized?([@shared_dataset_scope])).to eq(true)
        expect(oau.authorized?([@non_shared_dataset_scope])).to eq(false)

        # remove shared permissions
        @shared_table.table_visualization.reload
        perm = @shared_table.table_visualization.permission
        perm.acl = [{ type: 'user', entity: { id: organization_user_2.id }, access: 'r' }]
        perm.save!

        shared_dataset_scope_rw = "datasets:rw:#{organization_user_1.database_schema}.#{@shared_table.name}"
        expect(oau.authorized?([@shared_dataset_scope])).to eq(true)
        expect(oau.authorized?([shared_dataset_scope_rw])).to eq(false)

        # remove shared permissions
        @shared_table.table_visualization.reload
        perm = @shared_table.table_visualization.permission
        perm.acl = []
        perm.save!

        expect(oau.authorized?([@shared_dataset_scope])).to eq(false)
        expect(oau.authorized?([@non_shared_dataset_scope])).to eq(false)
      end

      describe 'read - write permissions' do
        before do
          @only_read_table = create_table(user_id: organization_user_1.id)

          perm = @only_read_table.table_visualization.permission
          perm.acl = [{ type: 'user', entity: { id: organization_user_2.id }, access: 'r' }]
          perm.save!
        end

        it 'should fail write scope in shared dataset with only read perms' do
          rw_scope = "datasets:rw:#{organization_user_1.database_schema}.#{@only_read_table.name}"
          expect {
            OauthAppUser.create!(user: organization_user_2, oauth_app: app, scopes: [rw_scope])
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end
      end

      describe 'organization shared datasets' do
        before do
          @org_shared_table = create_table(user_id: organization_user_1.id)
          non_org_shared_table = create_table(user_id: organization_user_1.id)

          perm = @org_shared_table.table_visualization.permission
          perm.acl = [
            {
              type: Carto::Permission::TYPE_ORGANIZATION,
              entity: { id: organization.id },
              access: Carto::Permission::ACCESS_READWRITE
            }
          ]
          perm.save!

          @org_shared_dataset_scope = "datasets:r:#{organization_user_1.database_schema}.#{@org_shared_table.name}"
          @non_org_shared_dataset_scope = "datasets:r:#{organization_user_1.database_schema}.#{non_org_shared_table.name}"
        end

        it 'works with org shared dataset' do
          oau = OauthAppUser.create!(user: organization_user_2, oauth_app: app, scopes: [@org_shared_dataset_scope])
          expect(oau.all_scopes).to(eq([@org_shared_dataset_scope]))
        end

        it 'should fail with non org shared dataset' do
          expect {
            OauthAppUser.create!(user: organization_user_2, oauth_app: app, scopes: [@non_org_shared_dataset_scope])
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end

        it 'should fail with org shared and non org shared dataset' do
          expect {
            OauthAppUser.create!(
              user: organization_user_2,
              oauth_app: app,
              scopes: [@org_shared_dataset_scope, @non_org_shared_dataset_scope]
            )
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end

        describe 'read - write permissions' do
          before do
            @only_read_table = create_table(user_id: organization_user_1.id)

            perm = @only_read_table.table_visualization.permission
            perm.acl = [
              {
                type: Carto::Permission::TYPE_ORGANIZATION,
                entity: { id: organization.id },
                access: Carto::Permission::ACCESS_READONLY
              }
            ]
            perm.save!
          end

          it 'should fail write scope in org shared dataset with only read perms' do
            rw_scope = "datasets:rw:#{organization_user_1.database_schema}.#{@only_read_table.name}"
            expect {
              OauthAppUser.create!(user: organization_user_2, oauth_app: app, scopes: [rw_scope])
            }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
          end
        end
      end
    end

    describe 'views' do
      before do
        @user_table = create_table(user_id: user.id)

        @view_name = "#{@user_table.name}_view"
        @materialized_view_name = "#{@user_table.name}_matview"
        user.in_database do |db|
          query = %{
            CREATE VIEW #{@view_name} AS SELECT * FROM #{@user_table.name};
            CREATE MATERIALIZED VIEW #{@materialized_view_name} AS SELECT * FROM #{@user_table.name};
          }
          db.execute(query)
        end
        app = create(:oauth_app, user: user)
      end

      it 'validates view scope' do
        oau = OauthAppUser.create!(
          user: user,
          oauth_app: app,
          scopes: ["datasets:r:#{@view_name}"]
        )
        expect(oau.all_scopes).to(eq(["datasets:r:#{@view_name}"]))
      end

      it 'validates materialized view scope' do
        oau = OauthAppUser.create!(
          user: user,
          oauth_app: app,
          scopes: ["datasets:r:#{@materialized_view_name}"]
        )
        expect(oau.all_scopes).to(eq(["datasets:r:#{@materialized_view_name}"]))
      end
    end

    describe '#destroy' do
      let(:app_user) { Carto::OauthAppUser.create!(user_id: user.id, oauth_app: app) }

      before do
        access_token = OauthAccessToken.create!(oauth_app_user: app_user,
                                                scopes: ["schemas:c:#{user.database_schema}"])
        @api_key = access_token.api_key
      end

      it 'drops the created roles' do
        find_role_query = "SELECT * FROM pg_roles WHERE rolname LIKE '%#{app_user.id}'"
        user.sequel_user.in_database.fetch(find_role_query).count.should eq 2

        app_user.destroy

        user.sequel_user.in_database.fetch(find_role_query).count.should eq 0
      end

      it 'reassigns the ownership of created tables to the master role' do
        with_connection_from_api_key(@api_key) { |db| db.execute('CREATE TABLE puxa()') }
        find_owner_query = "SELECT tableowner FROM pg_tables WHERE tablename = 'puxa'"
        user.sequel_user.in_database.fetch(find_owner_query).first[:tableowner].should eql app_user.ownership_role_name

        app_user.destroy

        user.sequel_user.in_database.fetch(find_owner_query).first[:tableowner].should eql user.database_username
      end
    end
  end
end

# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe OauthAppUser do
    include_context 'organization with users helper'
    include CartoDB::Factories

    describe '#validation' do
      before(:all) do
        @user = FactoryGirl.create(:carto_user)
        @app = FactoryGirl.create(:oauth_app, user: @user)
      end

      after(:all) do
        @user.destroy
        @app.destroy
      end

      it 'requires user' do
        app_user = OauthAppUser.new
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:user]).to(include("can't be blank"))
      end

      it 'requires oauth app_user' do
        app_user = OauthAppUser.new
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:oauth_app]).to(include("can't be blank"))
      end

      it 'does not allow duplicates' do
        begin
          @app_user1 = OauthAppUser.create!(user: @user, oauth_app: @app)
          app_user2 = OauthAppUser.new(user: @user, oauth_app: @app)
          expect(app_user2).to_not(be_valid)
          expect(app_user2.errors[:user]).to(include("has already been taken"))
        ensure
          @app_user1.destroy if @app_user1
        end
      end

      it 'does not accept invalid scopes' do
        app_user = OauthAppUser.new(scopes: ['wadus'])
        expect(app_user).to_not(be_valid)
        expect(app_user.errors[:scopes]).to(include("contains unsupported scopes: wadus"))
      end

      it 'validates' do
        app_user = OauthAppUser.new(user: @user, oauth_app: @app)
        expect(app_user).to(be_valid)
      end

      describe 'restricted app' do
        before(:all) do
          @app.update!(restricted: true)
        end

        before(:each) do
          @app.oauth_app_organizations.each(&:destroy!)
          @app.oauth_app_organizations.create!(organization: @carto_organization, seats: 1)
        end

        after(:all) do
          @app.destroy
        end

        it 'does not accept non-organization users' do
          app_user = OauthAppUser.new(user: @user, oauth_app: @app)
          expect(app_user).not_to(be_valid)
          expect(app_user.errors[:user]).to(include("is not part of an organization"))
        end

        it 'does not accept users from unknown organizations' do
          @app.oauth_app_organizations.each(&:destroy!)
          @app.oauth_app_organizations.create!(organization: @carto_organization_2, seats: 1)

          app_user = OauthAppUser.new(user: @carto_org_user_1, oauth_app: @app)
          expect(app_user).not_to(be_valid)
          expect(app_user.errors[:user]).to(include("is part of an organization which is not allowed access to this application"))
        end

        it 'accepts users from the authorized organization' do
          app_user = OauthAppUser.new(user: @carto_org_user_1, oauth_app: @app)
          expect(app_user).to(be_valid)
        end

        it 'does not accepts users over the seat limit' do
          OauthAppUser.create!(user: @carto_org_user_1, oauth_app: @app)
          app_user = OauthAppUser.new(user: @carto_org_user_2, oauth_app: @app)
          expect(app_user).not_to(be_valid)
          expect(app_user.errors[:user]).to(include("does not have an available seat to use this application"))
        end
      end
    end

    describe '#authorized?' do
      before(:all) do
        @user = FactoryGirl.create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
      end

      before(:each) do
        @app = FactoryGirl.create(:oauth_app, user: @carto_user)
        @t1 = create_table(user_id: @carto_user.id)
        @t2 = create_table(user_id: @carto_user.id)
      end

      after(:each) do
        @t1.destroy
        @t2.destroy
        @app.destroy
      end

      after(:all) do
        @user.destroy
        @carto_user.destroy
      end

      it 'is authorized only if all requested scopes are already granted' do
        o1 = "datasets:rw:#{@carto_user.database_schema}.#{@t1.name}"
        o2 = "datasets:rw:#{@carto_user.database_schema}.#{@t2.name}"
        o3 = "schemas:c:#{@carto_user.database_schema}"

        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: [o1, o2, o3])

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

        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: [write_read])

        expect(oau).to(be_authorized([read]))
      end

      it 'should NOT be authorized if requesting read-write permission having only read' do
        write_read = "datasets:rw:#{@t1.name}"
        read = "datasets:r:#{@t1.name}"

        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: [read])

        expect(oau).not_to(be_authorized([write_read]))
      end
    end

    describe '#upgrade!' do
      before(:all) do
        @user = FactoryGirl.create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
        @app = FactoryGirl.create(:oauth_app, user: @carto_user)
        @t1 = create_table(user_id: @carto_user.id)
        @t2 = create_table(user_id: @carto_user.id)
        @t3 = create_table(user_id: @carto_user.id)
        @t4 = create_table(user_id: @carto_user.id)
      end

      after(:all) do
        @t1.destroy
        @t2.destroy
        @t3.destroy
        @t4.destroy
        @app.destroy
        @user.destroy
        @carto_user.destroy
      end

      it 'grants all new scopes without duplicates' do
        o1 = "datasets:rw:#{@t1.name}"
        o2 = "datasets:rw:#{@t2.name}"
        o3 = "datasets:rw:#{@t3.name}"
        o4 = "datasets:rw:#{@t4.name}"
        o5 = "schemas:c:#{@carto_user.database_schema}"

        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: [o1, o2])

        oau.upgrade!([])
        expect(oau.scopes).to(eq([o1, o2]))

        oau.upgrade!([o1])
        expect(oau.scopes).to(eq([o1, o2]))

        oau.upgrade!([o3])
        expect(oau.scopes).to(eq([o1, o2, o3]))

        oau.upgrade!([o2, o4])
        expect(oau.scopes).to(eq([o1, o2, o3, o4]))

        oau.upgrade!([])
        expect(oau.scopes).to(eq([o1, o2, o3, o4]))

        oau.upgrade!([o5])
        expect(oau.scopes).to(eq([o1, o2, o3, o4, o5]))
      end
    end

    describe 'datasets scope' do
      before(:all) do
        @user = FactoryGirl.create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
        @app = FactoryGirl.create(:oauth_app, user: @carto_user)
        @table1 = create_table(user_id: @carto_user.id)
        @table2 = create_table(user_id: @carto_user.id)
      end

      after(:all) do
        @table1.destroy
        @table2.destroy
        @app.destroy
        @user.destroy
        @carto_user.destroy
      end

      it 'creation and update' do
        dataset_scope1 = "datasets:rw:#{@table1.name}"
        dataset_scope2 = "datasets:r:#{@table2.name}"
        scopes = ['user:profile', dataset_scope1, dataset_scope2]

        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: scopes)
        expect(oau.scopes).to(eq(scopes))

        oau.upgrade!([])
        expect(oau.scopes).to(eq(scopes))

        oau.upgrade!([dataset_scope1])
        expect(oau.scopes).to(eq(scopes))

        oau.destroy
      end

      it 'rename table' do
        scopes_before = ['user:profile', "datasets:rw:#{@table1.name}"]
        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: scopes_before)
        expect(oau.all_scopes).to(eq(scopes_before))

        @table1.name = 'table_renamed_' + @table1.name
        @table1.save

        expect(oau.all_scopes).to_not(eq(scopes_before))

        scopes_after = ['user:profile', "datasets:rw:#{@table1.name}"]
        expect(oau.all_scopes).to(eq(scopes_after))

        oau.destroy
      end
    end

    describe 'shared datasets' do
      before :each do
        @app = FactoryGirl.create(:oauth_app, user: @carto_org_user_1)
        @shared_table = create_table(user_id: @carto_org_user_1.id)
        not_shared_table = create_table(user_id: @carto_org_user_1.id)

        perm = @shared_table.table_visualization.permission
        perm.acl = [{ type: 'user', entity: { id: @carto_org_user_2.id }, access: 'rw' }]
        perm.save!

        @shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{@shared_table.name}"
        @non_shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{not_shared_table.name}"
      end

      after :each do
        @app.destroy
      end

      it 'works with shared dataset' do
        oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@shared_dataset_scope])
        expect(oau.all_scopes).to(eq([@shared_dataset_scope]))
      end

      it 'should fail with non shared dataset' do
        expect {
          OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@non_shared_dataset_scope])
        }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
      end

      it 'should fail with shared and non shared dataset' do
        expect {
          OauthAppUser.create!(
            user: @carto_org_user_2,
            oauth_app: @app,
            scopes: [@shared_dataset_scope, @non_shared_dataset_scope]
          )
        }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
      end

      it 'should revoke permissions removing shared permissions' do
        oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@shared_dataset_scope])
        expect(oau.all_scopes).to(eq([@shared_dataset_scope]))

        expect(oau.authorized?([@shared_dataset_scope])).to eq(true)
        expect(oau.authorized?([@non_shared_dataset_scope])).to eq(false)

        # remove shared permissions
        @shared_table.table_visualization.reload
        perm = @shared_table.table_visualization.permission
        perm.acl = [{ type: 'user', entity: { id: @carto_org_user_2.id }, access: 'r' }]
        perm.save!

        shared_dataset_scope_rw = "datasets:rw:#{@carto_org_user_1.database_schema}.#{@shared_table.name}"
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
        before :each do
          @only_read_table = create_table(user_id: @carto_org_user_1.id)

          perm = @only_read_table.table_visualization.permission
          perm.acl = [{ type: 'user', entity: { id: @carto_org_user_2.id }, access: 'r' }]
          perm.save!
        end

        after :each do
          @only_read_table.destroy
        end

        it 'should fail write scope in shared dataset with only read perms' do
          rw_scope = "datasets:rw:#{@carto_org_user_1.database_schema}.#{@only_read_table.name}"
          expect {
            OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [rw_scope])
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end
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
              access: Permission::ACCESS_READWRITE
            }
          ]
          perm.save!

          @org_shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{@org_shared_table.name}"
          @non_org_shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{non_org_shared_table.name}"
        end

        it 'works with org shared dataset' do
          oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@org_shared_dataset_scope])
          expect(oau.all_scopes).to(eq([@org_shared_dataset_scope]))
        end

        it 'should fail with non org shared dataset' do
          expect {
            OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@non_org_shared_dataset_scope])
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end

        it 'should fail with org shared and non org shared dataset' do
          expect {
            OauthAppUser.create!(
              user: @carto_org_user_2,
              oauth_app: @app,
              scopes: [@org_shared_dataset_scope, @non_org_shared_dataset_scope]
            )
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end

        describe 'read - write permissions' do
          before :each do
            @only_read_table = create_table(user_id: @carto_org_user_1.id)

            perm = @only_read_table.table_visualization.permission
            perm.acl = [
              {
                type: Permission::TYPE_ORGANIZATION,
                entity: { id: @carto_organization.id },
                access: Permission::ACCESS_READONLY
              }
            ]
            perm.save!
          end

          after :each do
            @only_read_table.destroy
          end

          it 'should fail write scope in org shared dataset with only read perms' do
            rw_scope = "datasets:rw:#{@carto_org_user_1.database_schema}.#{@only_read_table.name}"
            expect {
              OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [rw_scope])
            }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
          end
        end
      end
    end

    describe 'views' do
      before :all do
        @user = FactoryGirl.create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
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
      end

      before :each do
        @app = FactoryGirl.create(:oauth_app, user: @carto_user)
      end

      after :each do
        @app.destroy
      end

      after :all do
        @carto_user.in_database do |db|
          query = %{
            DROP VIEW #{@view_name};
            DROP MATERIALIZED VIEW #{@materialized_view_name};
          }
          db.execute(query)
        end

        @user_table.destroy
        @user.destroy
        @carto_user.destroy
      end

      it 'validates view scope' do
        oau = OauthAppUser.create!(
          user: @carto_user,
          oauth_app: @app,
          scopes: ["datasets:r:#{@view_name}"]
        )
        expect(oau.all_scopes).to(eq(["datasets:r:#{@view_name}"]))
      end

      it 'validates materialized view scope' do
        oau = OauthAppUser.create!(
          user: @carto_user,
          oauth_app: @app,
          scopes: ["datasets:r:#{@materialized_view_name}"]
        )
        expect(oau.all_scopes).to(eq(["datasets:r:#{@materialized_view_name}"]))
      end
    end
  end
end

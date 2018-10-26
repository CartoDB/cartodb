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
        @app = FactoryGirl.create(:oauth_app, user: @carto_user)
      end

      after(:all) do
        @app.destroy
        @user.destroy
        @carto_user.destroy
      end

      it 'is authorized only if all requested scopes are already granted' do
        oau = OauthAppUser.new(user: @carto_user, oauth_app: @app, scopes: ['allowed_1', 'allowed_2'])

        expect(oau).to(be_authorized(['allowed_1']))
        expect(oau).to(be_authorized(['allowed_2']))
        expect(oau).to(be_authorized(['allowed_1', 'allowed_2']))

        expect(oau).not_to(be_authorized(['not_allowed']))
        expect(oau).not_to(be_authorized(['allowed_1', 'not_allowed']))
      end
    end

    describe '#upgrade!' do
      before(:all) do
        @user = FactoryGirl.create(:valid_user)
        @carto_user = Carto::User.find(@user.id)
        @app = FactoryGirl.create(:oauth_app, user: @carto_user)
      end

      after(:all) do
        @app.destroy
        @user.destroy
        @carto_user.destroy
      end

      it 'grants all new scopes without duplicates' do
        OauthAppUser::ScopesValidator.any_instance.stubs(:validate_each)
        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: ['allowed_1', 'allowed_2'])

        oau.upgrade!([])
        expect(oau.scopes).to(eq(['allowed_1', 'allowed_2']))

        oau.upgrade!(['allowed_1'])
        expect(oau.scopes).to(eq(['allowed_1', 'allowed_2']))

        oau.upgrade!(['new_1'])
        expect(oau.scopes).to(eq(['allowed_1', 'allowed_2', 'new_1']))

        oau.upgrade!(['allowed_2', 'new_2'])
        expect(oau.scopes).to(eq(['allowed_1', 'allowed_2', 'new_1', 'new_2']))

        oau.upgrade!([])
        expect(oau.scopes).to(eq(['allowed_1', 'allowed_2', 'new_1', 'new_2']))
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
      end
    end

    describe 'shared datasets' do
      before :each do
        @app = FactoryGirl.create(:oauth_app, user: @carto_org_user_1)
        @shared_table = create_table(user_id: @carto_org_user_1.id)
        not_shared_table = create_table(user_id: @carto_org_user_1.id)

        perm = @shared_table.table_visualization.permission
        perm.acl = [{ type: 'user', entity: { id: @carto_org_user_2.id }, access: 'r' }]
        perm.save!

        @shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{@shared_table.name}"
        @non_shared_dataset_scope = "datasets:r:#{@carto_org_user_1.database_schema}.#{not_shared_table.name}"
      end

      after :each do
        @app.destroy
      end

      it 'works with shared dataset' do
        oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@shared_dataset_scope])
        expect(oau.scopes).to(eq([@shared_dataset_scope]))
      end

      it 'should fail with non shared dataset' do
        expect {
          oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@non_shared_dataset_scope])
        }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
      end

      it 'should fail with shared and non shared dataset' do
        expect {
          oau = OauthAppUser.create!(
            user: @carto_org_user_2,
            oauth_app: @app,
            scopes: [@shared_dataset_scope, @non_shared_dataset_scope]
          )
        }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
      end

      it 'should fail write scope in shared dataset with only read perms' do
        rw_scope = "datasets:rw:#{@carto_org_user_1.database_schema}.#{@shared_table.name}"
        expect {
          oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [rw_scope])
        }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
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

        it 'works with org shared dataset' do
          oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@org_shared_dataset_scope])
          expect(oau.scopes).to(eq([@org_shared_dataset_scope]))
        end

        it 'should fail with non org shared dataset' do
          expect {
            oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [@non_org_shared_dataset_scope])
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end

        it 'should fail with org shared and non org shared dataset' do
          expect {
            oau = OauthAppUser.create!(
              user: @carto_org_user_2,
              oauth_app: @app,
              scopes: [@org_shared_dataset_scope, @non_org_shared_dataset_scope]
            )
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
        end

        it 'should fail write scope in org shared dataset with only read perms' do
          rw_scope = "datasets:rw:#{@carto_org_user_1.database_schema}.#{@org_shared_table.name}"
          expect {
            oau = OauthAppUser.create!(user: @carto_org_user_2, oauth_app: @app, scopes: [rw_scope])
          }.to raise_error(Carto::OauthProvider::Errors::InvalidScope)
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
            GRANT SELECT ON #{@view_name} TO \"#{@carto_user.database_username}\";
            CREATE MATERIALIZED VIEW #{@materialized_view_name} AS SELECT * FROM #{@user_table.name};
            GRANT SELECT ON #{@materialized_view_name} TO \"#{@carto_user.database_username}\";
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
        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: ["datasets:r:#{@view_name}"])
        expect(oau.scopes).to(eq(["datasets:r:#{@view_name}"]))
      end

      it 'validates materialized view scope' do
        oau = OauthAppUser.create!(user: @carto_user, oauth_app: @app, scopes: ["datasets:r:#{@materialized_view_name}"])
        expect(oau.scopes).to(eq(["datasets:r:#{@materialized_view_name}"]))
      end
    end
  end
end

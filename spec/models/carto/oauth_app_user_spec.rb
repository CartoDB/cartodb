# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe OauthAppUser do
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
        expect(app_user.errors[:scopes]).to(include("contains unsuported scopes: wadus"))
      end

      it 'validates' do
        app_user = OauthAppUser.new(user: @user, oauth_app: @app)
        expect(app_user).to(be_valid)
      end

      describe 'restricted app' do
        include_context 'organization with users helper'

        before(:all) do
          @app.update!(restricted: true)
        end

        before(:each) do
          @app.oauth_app_organizations.each(&:destroy!)
          @app.oauth_app_organizations.create!(organization: @carto_organization, seats: 1)
        end

        after(:all) do
          @app.update!(restricted: false)
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
      it 'is authorized only if all requested scopes are already granted' do
        oau = OauthAppUser.new(scopes: ['allowed_1', 'allowed_2'])

        expect(oau).to(be_authorized(['allowed_1']))
        expect(oau).to(be_authorized(['allowed_2']))
        expect(oau).to(be_authorized(['allowed_1', 'allowed_2']))

        expect(oau).not_to(be_authorized(['not_allowed']))
        expect(oau).not_to(be_authorized(['allowed_1', 'not_allowed']))
      end
    end

    describe '#upgrade!' do
      before(:all) do
        @user = FactoryGirl.create(:carto_user)
        @app = FactoryGirl.create(:oauth_app, user: @user)
      end

      after(:all) do
        @user.destroy
        @app.destroy
      end

      it 'grants all new scopes without duplicates' do
        OauthAppUser::ScopesValidator.any_instance.stubs(:validate_each)
        oau = OauthAppUser.create!(user: @user, oauth_app: @app, scopes: ['allowed_1', 'allowed_2'])

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
  end
end

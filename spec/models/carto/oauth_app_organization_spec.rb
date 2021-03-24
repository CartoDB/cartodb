require 'spec_helper_unit'

module Carto
  describe OauthAppOrganization do
    let(:user) { create(:carto_user, factory_bot_context: { only_db_setup: true }) }
    let(:organization) { create(:organization) }
    let(:app) { create(:oauth_app, user: user) }

    describe '#validation' do
      it 'requires organization' do
        app_organization = OauthAppOrganization.new
        expect(app_organization).to_not(be_valid)
        expect(app_organization.errors[:organization]).to(include("can't be blank"))
      end

      it 'requires oauth app' do
        app_organization = OauthAppOrganization.new
        expect(app_organization).to_not(be_valid)
        expect(app_organization.errors[:oauth_app]).to(include("can't be blank"))
      end

      it 'does not allow duplicates' do
        begin
          app_organization1 = OauthAppOrganization.create!(organization: organization, oauth_app: app, seats: 1)
          app_organization2 = OauthAppOrganization.new(organization: organization, oauth_app: app, seats: 1)
          expect(app_organization2).to_not(be_valid)
          expect(app_organization2.errors[:organization]).to(include("has already been taken"))
        ensure
          app_organization1.destroy if app_organization1
        end
      end

      it 'requires positive seats' do
        app_organization = OauthAppOrganization.new
        expect(app_organization).to_not(be_valid)
        expect(app_organization.errors[:seats]).to(include("can't be blank"))

        app_organization.seats = 'wadus'
        expect(app_organization).to_not(be_valid)
        expect(app_organization.errors[:seats]).to(include("is not a number"))

        app_organization.seats = 0
        expect(app_organization).to_not(be_valid)
        expect(app_organization.errors[:seats]).to(include("must be greater than 0"))
      end

      it 'validates' do
        app_organization = OauthAppOrganization.new(organization: organization, oauth_app: app, seats: 5)
        expect(app_organization).to(be_valid)
      end
    end
  end
end

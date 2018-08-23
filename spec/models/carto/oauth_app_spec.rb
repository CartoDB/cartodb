# encoding: utf-8

require 'spec_helper_min'

module Carto
  describe OauthApp do
    describe '#validation' do
      before(:all) do
        @user = FactoryGirl.build(:carto_user)
      end

      it 'requires user' do
        app = OauthApp.new
        expect(app).to_not(be_valid)
        expect(app.errors[:user]).to(include("can't be blank"))
      end

      it 'requires name' do
        app = OauthApp.new
        expect(app).to_not(be_valid)
        expect(app.errors[:name]).to(include("can't be blank"))

        app.name = ''
        expect(app).to_not(be_valid)
        expect(app.errors[:name]).to(include("can't be blank"))
      end

      describe 'redirection uri' do
        it 'rejected if empty' do
          app = OauthApp.new
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include("can't be blank"))
        end

        it 'rejected if invalid' do
          app = OauthApp.new(redirect_uris: ['"invalid"'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be valid'))
        end

        it 'rejected if non-absolute' do
          app = OauthApp.new(redirect_uris: ['//wadus.com/path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be absolute'))

          app = OauthApp.new(redirect_uris: ['/some_path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be absolute'))
        end

        it 'rejected if non-https' do
          app = OauthApp.new(redirect_uris: ['http://wadus.com/path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be https'))

          app = OauthApp.new(redirect_uris: ['file://some_path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be https'))
        end

        it 'rejected if has fragment' do
          app = OauthApp.new(redirect_uris: ['https://wad.us/?query#fragment'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must not contain a fragment'))
        end

        it 'accepted if valid' do
          app = OauthApp.new(redirect_uris: ['https://wad.us/path?query=value'])
          app.valid?
          expect(app.errors[:redirect_uris]).to(be_empty)
        end
      end

      it 'accepts if valid' do
        app = OauthApp.new(user: @user, name: 'name', redirect_uris: ['https://re.dir'])
        expect(app).to(be_valid)
      end
    end

    it 'fills client id and secret automatically' do
      app = OauthApp.new
      app.save

      expect(app.client_id).to(be_present)
      expect(app.client_secret).to(be_present)
    end
  end
end

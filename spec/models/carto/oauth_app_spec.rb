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

      describe 'redirection urls' do
        it 'rejected if empty' do
          app = OauthApp.new
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_urls]).to(include("can't be blank"))
        end

        it 'rejected if invalid' do
          app = OauthApp.new(redirect_urls: ['"invalid"'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_urls]).to(include('"invalid" must be valid'))
        end

        it 'rejected if non-absolute' do
          app = OauthApp.new(redirect_urls: ['//wadus.com/path', '/some_path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_urls]).to(include('//wadus.com/path must be absolute'))
          expect(app.errors[:redirect_urls]).to(include('/some_path must be absolute'))
        end

        it 'rejected if non-https' do
          app = OauthApp.new(redirect_urls: ['http://wadus.com/path', 'file://some_path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_urls]).to(include('http://wadus.com/path must be https'))
          expect(app.errors[:redirect_urls]).to(include('file://some_path must be https'))
        end

        it 'rejected if has fragment' do
          app = OauthApp.new(redirect_urls: ['https://wad.us/?query#fragment'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_urls]).to(include('https://wad.us/?query#fragment must not contain a fragment'))
        end

        it 'accepted if valid' do
          app = OauthApp.new(redirect_urls: ['https://wad.us/path?query=value'])
          app.valid?
          expect(app.errors[:redirect_urls]).to(be_empty)
        end
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

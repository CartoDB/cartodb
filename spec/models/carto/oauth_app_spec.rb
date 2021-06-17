require 'spec_helper_unit'

module Carto
  describe OauthApp do
    describe '#validation' do
      before do
        @user = create(:carto_user, factory_bot_context: { only_db_setup: true })
      end

      it 'requires user' do
        Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
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

      it 'rejects if icon_url invalid' do
        app = OauthApp.new
        app.icon_url = 'carto.com'
        expect(app).to_not(be_valid)
        expect(app.errors[:icon_url]).to(include("must be a valid URL"))
      end

      describe 'restriction' do
        let(:organization_owner) do
          create(:organization, :with_owner, owner: @user)
          @user.reload
        end

        it 'restrict the access to the user\'s organization if it exists' do
          app = described_class.new(user: organization_owner,
                                    name: 'name',
                                    redirect_uris: ['https://re.dir'],
                                    website_url: 'http://localhost')
          expect(app).to(be_valid)

          app.save!

          expect(app.restricted).to(be_true)
          expect(app.oauth_app_organizations).not_to(be_empty)

          oauth_app_organization = app.oauth_app_organizations.take

          expect(oauth_app_organization.organization_id).to eq(organization_owner.organization_id)
          expect(oauth_app_organization.seats).to eq(organization_owner.organization.seats)
        end

        it 'doesn\'t add restrictions if the user has no organization' do
          app = described_class.new(user: @user,
                                    name: 'name',
                                    redirect_uris: ['https://re.dir'],
                                    website_url: 'http://localhost')
          expect(app).to(be_valid)

          app.save!

          expect(app.restricted).to(be_false)
          expect(app.oauth_app_organizations).to(be_empty)
        end
      end

      describe 'redirection uri' do
        it 'rejects if empty' do
          app = OauthApp.new
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include("can't be blank"))
        end

        it 'rejects if invalid' do
          app = OauthApp.new(redirect_uris: ['"invalid"'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be valid'))
        end

        it 'rejects if non-absolute' do
          app = OauthApp.new(redirect_uris: ['//wadus.com/path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be absolute'))

          app = OauthApp.new(redirect_uris: ['/some_path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be absolute'))
        end

        it 'rejects if non-https' do
          app = OauthApp.new(redirect_uris: ['http://wadus.com/path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be https'))

          app = OauthApp.new(redirect_uris: ['file://some_path'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must be https'))
        end

        it 'rejects if has fragment' do
          app = OauthApp.new(redirect_uris: ['https://wad.us/?query#fragment'])
          expect(app).to_not(be_valid)
          expect(app.errors[:redirect_uris]).to(include('must not contain a fragment'))
        end

        it 'accepts if valid' do
          app = OauthApp.new(redirect_uris: ['https://wad.us/path?query=value'])
          app.valid?
          expect(app.errors[:redirect_uris]).to(be_empty)
        end
      end

      it 'accepts if valid' do
        app = OauthApp.new(user: @user,
                           name: 'name',
                           redirect_uris: ['https://re.dir'],
                           icon_url: 'http://localhost/some.png',
                           website_url: 'http://localhost')
        expect(app).to(be_valid)
      end

      it 'accepts without icon_url' do
        app = OauthApp.create(user: @user,
                              name: 'name',
                              redirect_uris: ['https://re.dir'],
                              website_url: 'http://localhost')
        expect(app).to(be_valid)
      end

      it 'accepts with no user if avoid_sync_central and central enabled' do
        Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
        app = OauthApp.new(name: 'name',
                           redirect_uris: ['https://re.dir'],
                           icon_url: 'http://localhost/some.png',
                           website_url: 'http://localhost',
                           avoid_sync_central: true)
        expect(app).to(be_valid)
      end
    end

    context 'Central sync' do
      before do
        @user_oauth = create(:carto_user, factory_bot_context: { only_db_setup: true })
        Cartodb::Central.stubs(:api_sync_enabled?).returns(false)
        @oauth_app = create(:oauth_app, user: @user_oauth, avoid_sync_central: false)
      end

      describe '#create' do
        it 'creates app in clouds from Central' do
          Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
          params = { id: '26da639b-0b8c-4e81-aeb4-33b81fd0cacb',
                     name: 'name1',
                     redirect_uris: ['https://re.dir'],
                     icon_url: 'http://localhost/some.png',
                     website_url: 'http://localhost',
                     description: nil,
                     client_id: '1234',
                     client_secret: '5678',
                     restricted: false }
          Cartodb::Central.any_instance
                          .expects(:create_oauth_app)
                          .with(@user_oauth.username,
                                params)
                          .returns({})
                          .once

          expect {
            @oauth_app2 = OauthApp.new(params.merge(user: @user_oauth))
            @oauth_app2.id = params[:id]
            @oauth_app2.save!
          }.to change { OauthApp.count }.by(1)
        end

        it 'creates app if user not present and avoid_sync_central' do
          Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
          Cartodb::Central.any_instance.expects(:create_oauth_app).never

          expect {
            @oauth_app2 = OauthApp.create!(name: 'name1',
                                           redirect_uris: ['https://re.dir'],
                                           icon_url: 'http://localhost/some.png',
                                           website_url: 'http://localhost',
                                           avoid_sync_central: true)
          }.to change { OauthApp.count }.by(1)
        end

        it 'creates app if Central is disabled' do
          Cartodb::Central.any_instance.expects(:create_oauth_app).never

          expect {
            @oauth_app2 = OauthApp.create!(user: @user_oauth,
                                           name: 'name1',
                                           redirect_uris: ['https://re.dir'],
                                           website_url: 'http://localhost',
                                           icon_url: 'http://localhost/some.png')
          }.to change { OauthApp.count }.by(1)

        end

        it 'raises error if Central is disabled and no user' do
          Cartodb::Central.any_instance.expects(:create_oauth_app).never

          expect {
            @oauth_app2 = OauthApp.create!(name: 'name1',
                                           redirect_uris: ['https://re.dir'],
                                           website_url: 'http://localhost',
                                           icon_url: 'http://localhost/some.png')
          }.to raise_error
        end
      end

      describe '#update' do
        it 'updates app in clouds from Central' do
          Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
          Cartodb::Central.any_instance
                          .expects(:update_oauth_app)
                          .with(@user_oauth.username,
                                @oauth_app.id,
                                id: @oauth_app.id,
                                name: 'updated',
                                client_id: @oauth_app.client_id,
                                client_secret: @oauth_app.client_secret,
                                redirect_uris: @oauth_app.redirect_uris,
                                icon_url: @oauth_app.icon_url,
                                website_url: @oauth_app.website_url,
                                description: @oauth_app.description,
                                restricted: @oauth_app.restricted)
                          .returns({})
                          .once

          expect {
            @oauth_app.name = 'updated'
            @oauth_app.save!
          }.to_not raise_error

          @oauth_app.reload.name.should eq 'updated'
        end

        it 'updates app if Central is disabled' do
          Cartodb::Central.any_instance.expects(:update_oauth_app).never

          expect {
            @oauth_app.name = 'updated'
            @oauth_app.save!
          }.to_not raise_error

          @oauth_app.reload.name.should eq 'updated'
        end

        it 'updates app if Central is avoid_sync_central' do
          Cartodb::Central.any_instance.expects(:update_oauth_app).never

          @oauth_app.avoid_sync_central = true

          expect {
            @oauth_app.name = 'updated'
            @oauth_app.save!
          }.to_not raise_error

          @oauth_app.reload.name.should eq 'updated'
        end

        it 'updates app to no user with avoid_sync_central' do
          Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
          Cartodb::Central.any_instance.expects(:update_oauth_app).never

          @oauth_app.avoid_sync_central = true

          expect {
            @oauth_app.user = nil
            @oauth_app.save!
          }.to_not raise_error

          @oauth_app.reload.user.should be_nil
        end
      end

      describe '#destroy' do
        it 'does not send notification if destroying app with no users' do
          ::Resque.expects(:enqueue)
                  .with(::Resque::UserJobs::Notifications::Send, anything, anything)
                  .never

          expect {
            @oauth_app.destroy!
          }.to change { OauthApp.count }.by(-1)
        end

        it 'sends notification if destroying app with users' do
          @app_user = Carto::OauthAppUser.create!(user_id: @oauth_app.user.id, oauth_app: @oauth_app)
          ::Resque.expects(:enqueue)
                  .with(::Resque::UserJobs::Notifications::Send, [@app_user.user.id], anything)
                  .once

          expect {
            @oauth_app.destroy!
          }.to change { OauthApp.count }.by(-1)
        end

        it 'does not send notification if avoid_send_notification' do
          @app_user = Carto::OauthAppUser.create!(user_id: @oauth_app.user.id, oauth_app: @oauth_app)
          ::Resque.expects(:enqueue)
                  .with(::Resque::UserJobs::Notifications::Send, [@app_user.user.id], anything)
                  .never

          expect {
            @oauth_app.avoid_send_notification = true
            @oauth_app.destroy!
          }.to change { OauthApp.count }.by(-1)
        end

        it 'logs notification errors on destroy' do
          @app_user = Carto::OauthAppUser.create!(user_id: @oauth_app.user.id, oauth_app: @oauth_app)

          ::Resque.stubs(:enqueue).raises('unknown error')
          Rails.logger.expects(:warn).with(
            has_entry('message' => "Couldn't notify users about oauth_app deletion")
          )

          expect {
            @oauth_app.destroy!
          }.to raise_error(/unknown error/)
        end

        it 'deletes app in clouds from Central' do
          Cartodb::Central.stubs(:api_sync_enabled?).returns(true)
          Cartodb::Central.any_instance
                          .expects(:delete_oauth_app)
                          .with(@user_oauth.username, @oauth_app.id)
                          .returns({})
                          .once

          expect {
            @oauth_app.destroy!
          }.to change { OauthApp.count }.by(-1)
        end

        it 'deletes app if Central is disabled' do
          Cartodb::Central.any_instance.expects(:delete_oauth_app).never

          expect {
            @oauth_app.destroy!
          }.to change { OauthApp.count }.by(-1)
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

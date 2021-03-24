
require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

describe Carto::App::VisualizationsController do
  include Warden::Test::Helpers

  after(:all) do
    FileUtils.rmtree(Carto::Conf.new.public_uploads_path + '/html_assets')
  end

  describe '#show' do
    before(:each) do
      @app = create(:app_visualization)
      @app.save
      @asset = Carto::Asset.for_visualization(visualization: @app,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      login(@app.user)
    end

    it 'shows public app' do
      get app_show_url(id: @app.id)

      response.status.should eq 200
      response.body.scan(/test/).present?.should == true
      response.headers.include?('X-Frame-Options').should == false
    end

    it 'shows 404 on non-existent app' do
      get app_show_url(id: 'fake-uuid')

      response.status.should eq 404
    end

    context 'with password protected app' do
      before(:each) do
        @app.privacy = Carto::Visualization::PRIVACY_PROTECTED
        @app.password = 'test'
        @app.save
      end

      it 'does not require password for the owner' do
        get app_show_url(id: @app.id)

        response.status.should eq 200
        response.body.scan(/test/).present?.should == true
      end

      it 'does not require password when it is shared' do
        user2 = create(:carto_user)
        @app.permission.acl = [
          {
            type: Carto::Permission::TYPE_USER,
            entity: { id: user2.id, username: user2.username },
            access: Carto::Permission::ACCESS_READONLY
          }
        ]
        @app.permission.save
        logout
        login(user2)

        get app_show_url(id: @app.id)

        response.status.should eq 200
        response.body.scan(/test/).present?.should == true
      end

      it 'requires password for a user when it is not shared' do
        user2 = create(:carto_user)
        logout
        login(user2)

        get app_show_url(id: @app.id)

        response.status.should eq 200
        response.body.scan(/Insert your password/).present?.should == true
      end

      it 'requires password without session' do
        logout

        get app_show_url(id: @app.id)

        response.status.should eq 200
        response.body.scan(/Insert your password/).present?.should == true
      end
    end
  end

  describe '#show_protected' do
    before(:each) do
      @app = create(:app_protected_visualization)
      @app.save
      @asset = Carto::Asset.for_visualization(visualization: @app,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      login(@app.user)
    end

    it 'shows password error message is the password is incorrect' do
      post app_password_protected_url(id: @app.id), password: 'wrong_password'

      response.status.should eq 200
      response.body.scan(/Invalid password/).present?.should == true
    end

    it 'shows 404 if the app is not password protected' do
      @app.password = ''
      @app.privacy = Carto::Visualization::PRIVACY_PUBLIC
      @app.save
      post app_password_protected_url(id: @app.id), password: 'wrong_password'

      response.status.should eq 404
    end

    it 'shows password protected app' do
      post app_password_protected_url(id: @app.id), password: 'test'

      response.status.should eq 200
      response.body.scan(/<body>test<\/body>/).present?.should == true
      response.headers.include?('X-Frame-Options').should == false
    end
  end
end

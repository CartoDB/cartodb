require 'spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/public/apps_controller'
require_relative '../../../../lib/carto/configuration'

describe Carto::Api::Public::CustomVisualizationsController do
  include Warden::Test::Helpers
  include HelperMethods

  before(:all) do
    @user = create(:carto_user)
  end

  before(:each) do
    host! "#{@user.username}.localhost.lan"
  end

  after(:all) do
    @user.destroy
    FileUtils.rmtree(Carto::Conf.new.public_uploads_path + '/html_assets')
  end

  describe '#index' do
    before(:each) do
      @app = create(:app_visualization, user: @user, name: 'app')
      @app.save
      @asset = Carto::Asset.for_visualization(visualization: @app,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      @app_password = create(:app_protected_visualization, user: @user, name: 'app password')
      @app_password.save
      @asset_password = Carto::Asset.for_visualization(visualization: @app_password,
                                                       resource: StringIO.new('<html><body>test</body></html>'))
      @asset_password.save
    end

    after(:each) do
      @app.destroy
      @app_password.destroy
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      get_json api_v4_app_list_vizs_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      get_json api_v4_app_list_vizs_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      get_json api_v4_app_list_vizs_url(api_key: token) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'return 401 without api_key' do
      get_json api_v4_app_list_vizs_url do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'return 401 with cookie auth' do
      login_as(@user, scope: @user.username)
      get_json api_v4_app_list_vizs_url do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'shows all the apps' do
      get_json api_v4_app_list_vizs_url(api_key: @user.api_key) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(2)
        expect(response.body[:total_entries]).to eq(2)
      end
    end

    it 'should return one visualization but total should be two' do
      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1 do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
      end
    end

    it 'should order results by legal order fields: name, updated_at and privacy' do
      @app.name = '1'
      @app.updated_at = Time.parse('2019-01-01 00:00:00.000')
      @app.save
      @app_password.name = '2'
      @app_password.updated_at = Time.parse('2019-12-31 23:59:59.999')
      @app_password.save

      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:apps][0][:name]).to eq('2')
      end

      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:apps][0][:name]).to eq('1')
      end

      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'updated_at' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:apps][0][:updated_at]).to eq('2019-12-31T23:59:59.999Z')
      end

      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:apps][0][:updated_at]).to eq('2019-01-01T00:00:00.000Z')
      end

      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'privacy' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:apps][0][:privacy]).to eq('public')
      end

      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'privacy', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:apps][0][:privacy]).to eq('password')
      end

      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'non_valid' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error].scan(/Wrong 'order' parameter value/).present?).to be true
      end
    end

    it 'should return only password apps' do
      get_json api_v4_app_list_vizs_url(api_key: @user.api_key), privacy: 'password' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total_entries]).to eq(1)
        expect(response.body[:apps][0][:privacy]).to eq('password')
      end
    end
  end

  describe '#create' do
    before(:all) do
      @valid_html_base64 = Base64.strict_encode64('<html><head><title>test</title></head><body>test</body></html>')
      @app_name = 'app_name'
    end

    after(:each) do
      apps = Carto::Visualization.where(user: @user)
      apps.each(&:destroy!)
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      post_json api_v4_app_create_viz_url(api_key: token), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      post_json api_v4_app_create_viz_url(api_key: api_key.token), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      post_json api_v4_app_create_viz_url(api_key: api_key.token), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'rejects if name parameter is not send in the request' do
      string_base64 = Base64.strict_encode64('<html><body>test html</body></html>')
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: string_base64, name: nil do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing name parameter')
      end
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: string_base64 do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing name parameter')
      end
    end

    it 'rejects if data parameter is not send in the request' do
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: nil, name: @app_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing data parameter')
      end
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), name: @app_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing data parameter')
      end
    end

    it 'rejects if data parameter is not encoded in base64' do
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: 'non-base64 test', name: @app_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be encoded in base64')
      end
    end

    it 'rejects non html content' do
      string_base64 = Base64.strict_encode64('test string non-html')
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: string_base64, name: @app_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be HTML')
      end
      pixel_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: pixel_base64, name: @app_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be HTML')
      end
    end

    it 'stores html content' do
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:apps]).present?.should be true
        expect(response.body[:url]).present?.should be true
      end
    end

    it 'fails if exists an app with the same name' do
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq("Validation failed: Name has already been taken")
      end
    end

    it 'works if it does not exists an app with the same name' do
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end
      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: 'another name' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end
    end

    it 'works if it exists a visualization with the same name' do
      visualization = create(:carto_visualization, user: @user, name: @app_name)
      visualization.save!

      post_json api_v4_app_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @app_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end

      visualization.destroy!
    end
  end

  describe '#update' do
    before(:each) do
      @app = create(:app_visualization, user: @user)
      @app.save!
      @asset = Carto::Asset.for_visualization(visualization: @app,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save

      @app2 = create(:app_visualization, user: @user, name: 'app2')
      @app2.save!
      @asset2 = Carto::Asset.for_visualization(visualization: @app,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset2.save

      @app_other_user = create(:app_visualization)
      @app_other_user.save!
      @asset_other_user = Carto::Asset.for_visualization(visualization: @app_other_user,
                                               resource: StringIO.new('<html><body>test</body></html>'))
      @asset_other_user.save
    end

    after(:each) do
      @app.destroy!
      @app2.destroy!
      @app_other_user.destroy!
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      put_json api_v4_app_update_viz_url(api_key: token, id: @app.id), name: 'new name' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      put_json api_v4_app_update_viz_url(api_key: api_key.token, id: @app.id), name: 'new name' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      put_json api_v4_app_update_viz_url(api_key: api_key.token, id: @app.id), name: 'new name' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should update an existing app name' do
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), name: 'new name' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:name]).to eq('new name')
      end
    end

    it 'should update an existing app data' do
      get app_show_url(id: @app.id) do |response|
        response.status.should eq 200
        response.body.scan(/<body>test<\/body>/).present?.should == true
      end

      new_html_base64 = Base64.strict_encode64('<html><head><title>test</title></head><body>new data uploaded</body></html>')
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), data: new_html_base64 do |response|
        expect(response.status).to eq(200)
      end

      get app_show_url(id: @app.id) do |response|
        response.status.should eq 200
        response.body.scan(/<body>new data uploaded<\/body>/).present?.should == true
      end
    end

    it 'should update an existing app privacy' do
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), privacy: 'password', password: 'test' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:privacy]).to eq 'password'
      end

      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), privacy: 'public' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:privacy]).to eq 'public'
      end
    end

    it 'should fail if user tries to update privacy to protected and don\'t provide password' do
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), privacy: 'password' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq 'Changing privacy to protected should come along with the password param'
      end
    end

    it 'should fail if user tries to update privacy to private' do
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), privacy: 'private' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq 'privacy mode not allowed. Allowed ones are ["public", "password"]'
      end
    end

    it 'shouldn\'t update an existing app if the user doesn\'t have permission' do
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app_other_user.id), name: 'test' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should return 404 error if app doesn\'t exist' do
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: '47f41ab4-63de-439f-a826-de5deab14de6') do |response|
        expect(response.status).to eq(404)
      end
    end

    it 'rejects if name already exists' do
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), name: @app2.name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq("Validation failed: Name has already been taken")
      end
    end

    it 'works if name does not exists' do
      new_name = 'other_name'
      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), name: new_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true

        apps = Carto::Visualization.where(user: @user)
        expect(apps.length).to be [@app, @app2].length

        app_updated = Carto::Visualization.find(@app.id)
        expect(app_updated.id).to eq @app.id
        expect(app_updated.name).to eq new_name
        expect(app_updated.name).not_to eq @app.name
      end
    end

    it 'works if exists a visualization with the same name' do
      new_name = 'other_name'

      visualization = create(:carto_visualization, user: @user, name: new_name)
      visualization.save!

      put_json api_v4_app_update_viz_url(api_key: @user.api_key, id: @app.id), name: new_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end

      visualization.destroy!
    end
  end

  describe '#delete' do
    before(:each) do
      @app = create(:app_visualization, user: @user)
      @app.save
      @asset = Carto::Asset.for_visualization(visualization: @app,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      @app_other_user = create(:app_visualization)
      @app_other_user.save
      @asset_other_user = Carto::Asset.for_visualization(visualization: @app_other_user,
                                               resource: StringIO.new('<html><body>test</body></html>'))
      @asset_other_user.save
    end

    after(:each) do
      @app.destroy!
      @app_other_user.destroy!
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      delete_json api_v4_app_delete_viz_url(api_key: token, id: @app.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      delete_json api_v4_app_delete_viz_url(api_key: api_key.token, id: @app.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      delete_json api_v4_app_delete_viz_url(api_key: api_key.token, id: @app.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should delete app and assets' do
      expect(File.exist?(@asset.storage_info[:identifier])).to be true
      delete_json api_v4_app_delete_viz_url(api_key: @user.api_key, id: @app.id) do |response|
        expect(response.status).to eq(204)
        expect(File.exist?(@asset.storage_info[:identifier])).to be false
      end
    end

    it 'shouldn\'t delete a app for which the user doesn\'t have permissions' do
      delete_json api_v4_app_delete_viz_url(api_key: @user.api_key, id: @app_other_user.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should return 404 error if app doesn\'t exist' do
      delete_json api_v4_app_delete_viz_url(api_key: @user.api_key, id: '47f41ab4-63de-439f-a826-de5deab14de6') do |response|
        expect(response.status).to eq(404)
      end
    end
  end
end

require 'spec_helper_min'
require 'support/helpers'
require_relative '../../../../app/controllers/carto/api/public/custom_visualizations_controller'
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
      @kuviz = create(:kuviz_visualization, user: @user, name: 'kuviz')
      @kuviz.save
      @asset = Carto::Asset.for_visualization(visualization: @kuviz,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      @kuviz_password = create(:kuviz_protected_visualization, user: @user, name: 'kuviz password')
      @kuviz_password.save
      @asset_password = Carto::Asset.for_visualization(visualization: @kuviz_password,
                                                       resource: StringIO.new('<html><body>test</body></html>'))
      @asset_password.save
    end

    after(:each) do
      @kuviz.destroy
      @kuviz_password.destroy
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      get_json api_v4_kuviz_list_vizs_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      get_json api_v4_kuviz_list_vizs_url(api_key: api_key.token) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      get_json api_v4_kuviz_list_vizs_url(api_key: token) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'return 401 without api_key' do
      get_json api_v4_kuviz_list_vizs_url do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'return 401 with cookie auth' do
      login_as(@user, scope: @user.username)
      get_json api_v4_kuviz_list_vizs_url do |response|
        expect(response.status).to eq(401)
      end
    end

    it 'shows all the visualizations' do
      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key) do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(2)
        expect(response.body[:total_entries]).to eq(2)
      end
    end

    it 'should return one visualization but total should be two' do
      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1 do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
      end
    end

    it 'should order results by legal order fields: name, updated_at and privacy' do
      @kuviz.name = '1'
      @kuviz.updated_at = Time.parse('2019-01-01 00:00:00.000')
      @kuviz.save
      @kuviz_password.name = '2'
      @kuviz_password.updated_at = Time.parse('2019-12-31 23:59:59.999')
      @kuviz_password.save

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:name]).to eq('2')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:name]).to eq('1')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'updated_at' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:updated_at]).to eq('2019-12-31T23:59:59.999Z')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'name', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:updated_at]).to eq('2019-01-01T00:00:00.000Z')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'privacy' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:privacy]).to eq('public')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'privacy', order_direction: 'asc' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations].size).to eq(1)
        expect(response.body[:total_entries]).to eq(2)
        expect(response.body[:visualizations][0][:privacy]).to eq('password')
      end

      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), per_page: 1, order: 'non_valid' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error].scan(/Wrong 'order' parameter value/).present?).to be true
      end
    end

    it 'should return only password visualizations' do
      get_json api_v4_kuviz_list_vizs_url(api_key: @user.api_key), privacy: 'password' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:total_entries]).to eq(1)
        expect(response.body[:visualizations][0][:privacy]).to eq('password')
      end
    end
  end

  describe '#create' do
    before(:all) do
      @valid_html_base64 = Base64.strict_encode64('<html><head><title>test</title></head><body>test</body></html>')
      @kuviz_name = 'kuviz_name'
    end

    after(:each) do
      kuvizs = Carto::Visualization.where(user: @user)
      kuvizs.each(&:destroy!)
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      post_json api_v4_kuviz_create_viz_url(api_key: token), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      post_json api_v4_kuviz_create_viz_url(api_key: api_key.token), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      post_json api_v4_kuviz_create_viz_url(api_key: api_key.token), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(403)
      end
    end

    context 'with a plan limit of 1 public map' do
      before(:each) do
        @user.visualizations.each(&:destroy)
        @user.public_map_quota = 1
        @user.save
      end

      after(:each) do
        @user.public_map_quota = nil
        @user.save
      end

      it 'allows to create just one kuviz' do
        post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: 'a' do |response|
          expect(response.status).to eq(200)
        end

        post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: 'b' do |response|
          expect(response.status).to eq(402)
          expect(response.body[:errors]).to eql 'Public map quota exceeded'
        end
      end
    end

    it 'rejects if name parameter is not send in the request' do
      string_base64 = Base64.strict_encode64('<html><body>test html</body></html>')
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: string_base64, name: nil do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing name parameter')
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: string_base64 do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing name parameter')
      end
    end

    it 'rejects if data parameter is not send in the request' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: nil, name: @kuviz_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing data parameter')
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), name: @kuviz_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('missing data parameter')
      end
    end

    it 'rejects if data parameter is not encoded in base64' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: 'non-base64 test', name: @kuviz_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be encoded in base64')
      end
    end

    it 'rejects non html content' do
      string_base64 = Base64.strict_encode64('test string non-html')
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: string_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be HTML')
      end
      pixel_base64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: pixel_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq('data parameter must be HTML')
      end
    end

    it 'stores html content' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:visualizations]).present?.should be true
        expect(response.body[:url]).present?.should be true
      end
    end

    it 'rejects if if_exists parameter is not a valid one' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name, if_exists: 'wrong-option' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:errors]).to eq("Wrong 'if_exists' parameter value. Valid values are one of fail, replace")
      end
    end

    it 'fails if if_exists is fail and exists a kuviz with the same name' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq("Validation failed: Name has already been taken")
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name, if_exists: 'fail' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq("Validation failed: Name has already been taken")
      end
    end

    it 'works if if_exists is fail and does not exists a kuviz with the same name' do
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: 'another name' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end
    end

    it 'works if if_exists is replace and exists a kuviz with the same name' do
      kuviz1 = nil

      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true

        kuvizs = Carto::Visualization.where(user: @user, name: @kuviz_name)
        expect(kuvizs.length).to be 1
        kuviz1 = kuvizs.first
      end
      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name, if_exists: 'replace' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true

        kuvizs = Carto::Visualization.where(user: @user, name: @kuviz_name)
        expect(kuvizs.length).to be 1
        kuviz2 = kuvizs.first
        expect(kuviz1.id).to eq(kuviz2.id)
      end
    end

    it 'works if if_exists is fail and exists a visualization with the same name' do
      visualization = create(:carto_visualization, user: @user, name: @kuviz_name)
      visualization.save!

      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end

      visualization.destroy!
    end

    it 'works if if_exists is replace and exists a visualization with the same name' do
      visualization = create(:carto_visualization, user: @user, name: @kuviz_name)
      visualization.save!

      post_json api_v4_kuviz_create_viz_url(api_key: @user.api_key), data: @valid_html_base64, name: @kuviz_name, if_exists: 'replace' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end

      visualization.destroy!
    end
  end

  describe '#update' do
    before(:each) do
      @kuviz = create(:kuviz_visualization, user: @user)
      @kuviz.save!
      @asset = Carto::Asset.for_visualization(visualization: @kuviz,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save

      @kuviz2 = create(:kuviz_visualization, user: @user, name: 'kuviz2')
      @kuviz2.save!
      @asset2 = Carto::Asset.for_visualization(visualization: @kuviz,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset2.save

      @kuviz_other_user = create(:kuviz_visualization)
      @kuviz_other_user.save!
      @asset_other_user = Carto::Asset.for_visualization(visualization: @kuviz_other_user,
                                               resource: StringIO.new('<html><body>test</body></html>'))
      @asset_other_user.save
    end

    after(:each) do
      @kuviz.destroy!
      @kuviz2.destroy!
      @kuviz_other_user.destroy!
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      put_json api_v4_kuviz_update_viz_url(api_key: token, id: @kuviz.id), name: 'new name' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      put_json api_v4_kuviz_update_viz_url(api_key: api_key.token, id: @kuviz.id), name: 'new name' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      put_json api_v4_kuviz_update_viz_url(api_key: api_key.token, id: @kuviz.id), name: 'new name' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should update an existing kuviz name' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: 'new name' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:name]).to eq('new name')
      end
    end

    it 'should update an existing kuviz data' do
      get kuviz_show_url(id: @kuviz.id) do |response|
        response.status.should eq 200
        response.body.scan(/<body>test<\/body>/).present?.should == true
      end

      new_html_base64 = Base64.strict_encode64('<html><head><title>test</title></head><body>new data uploaded</body></html>')
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), data: new_html_base64 do |response|
        expect(response.status).to eq(200)
      end

      get kuviz_show_url(id: @kuviz.id) do |response|
        response.status.should eq 200
        response.body.scan(/<body>new data uploaded<\/body>/).present?.should == true
      end
    end

    it 'should update an existing kuviz privacy' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), privacy: 'password', password: 'test' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:privacy]).to eq 'password'
      end

      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), privacy: 'public' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:privacy]).to eq 'public'
      end
    end

    it 'should fail if user tries to update privacy to protected and don\'t provide password' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), privacy: 'password' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq 'Changing privacy to protected should come along with the password param'
      end
    end

    it 'should fail if user tries to update privacy to private' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), privacy: 'private' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq 'privacy mode not allowed. Allowed ones are ["public", "password"]'
      end
    end

    it 'shouldn\'t update an existing kuviz if the user doesn\'t have permission' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz_other_user.id), name: 'test' do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should return 404 error if kuviz doesn\'t exist' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: '47f41ab4-63de-439f-a826-de5deab14de6') do |response|
        expect(response.status).to eq(404)
      end
    end

    it 'rejects if if_exists parameter is not a valid one' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: 'test', if_exists: 'wrong-option' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:errors]).to eq("Wrong 'if_exists' parameter value. Valid values are one of fail, replace")
      end
    end

    it 'works if name already exists and if_exists is replace by default' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: @kuviz2.name do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true

        kuvizs = Carto::Visualization.where(user: @user)
        expect(kuvizs.length).to be [@kuviz].length

        kuviz_updated = Carto::Visualization.find(@kuviz.id)
        expect(kuviz_updated.id).to eq @kuviz.id
        expect(kuviz_updated.name).to eq @kuviz2.name
      end
    end

    it 'works if name already exists and if_exists is replace' do
        put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: @kuviz2.name, if_exists: 'replace' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true

        kuvizs = Carto::Visualization.where(user: @user)
        expect(kuvizs.length).to be [@kuviz].length

        kuviz_updated = Carto::Visualization.find(@kuviz.id)
        expect(kuviz_updated.id).to eq @kuviz.id
        expect(kuviz_updated.name).to eq @kuviz2.name
      end
    end

    it 'rejects if name already exists and if_exists is fail' do
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: @kuviz2.name, if_exists: 'fail' do |response|
        expect(response.status).to eq(400)
        expect(response.body[:error]).to eq("Validation failed: Name has already been taken")
      end
    end

    it 'works if if_exists is fail and name does not exists' do
      new_name = 'other_name'
      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: new_name, if_exists: 'fail' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true

        kuvizs = Carto::Visualization.where(user: @user)
        expect(kuvizs.length).to be [@kuviz, @kuviz2].length

        kuviz_updated = Carto::Visualization.find(@kuviz.id)
        expect(kuviz_updated.id).to eq @kuviz.id
        expect(kuviz_updated.name).to eq new_name
        expect(kuviz_updated.name).not_to eq @kuviz.name
      end
    end

    it 'works if exists a visualization with the same name' do
      new_name = 'other_name'

      visualization = create(:carto_visualization, user: @user, name: new_name)
      visualization.save!

      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: new_name, if_exists: 'fail' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end

      put_json api_v4_kuviz_update_viz_url(api_key: @user.api_key, id: @kuviz.id), name: new_name, if_exists: 'replace' do |response|
        expect(response.status).to eq(200)
        expect(response.body[:url].present?).to be true
      end

      visualization.destroy!
    end
  end

  describe '#delete' do
    before(:each) do
      @kuviz = create(:kuviz_visualization, user: @user)
      @kuviz.save
      @asset = Carto::Asset.for_visualization(visualization: @kuviz,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      @kuviz_other_user = create(:kuviz_visualization)
      @kuviz_other_user.save
      @asset_other_user = Carto::Asset.for_visualization(visualization: @kuviz_other_user,
                                               resource: StringIO.new('<html><body>test</body></html>'))
      @asset_other_user.save
    end

    after(:each) do
      @kuviz.destroy!
      @kuviz_other_user.destroy!
    end

    it 'returns 403 wih default_public api_key' do
      token = 'default_public'

      delete_json api_v4_kuviz_delete_viz_url(api_key: token, id: @kuviz.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 with oauth api_key' do
      api_key = create(:oauth_api_key, user_id: @user.id)

      delete_json api_v4_kuviz_delete_viz_url(api_key: api_key.token, id: @kuviz.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'returns 403 wih regular api_key' do
      api_key = create(:api_key_apis, user_id: @user.id)

      delete_json api_v4_kuviz_delete_viz_url(api_key: api_key.token, id: @kuviz.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should delete kuviz and assets' do
      expect(File.exist?(@asset.storage_info[:identifier])).to be true
      delete_json api_v4_kuviz_delete_viz_url(api_key: @user.api_key, id: @kuviz.id) do |response|
        expect(response.status).to eq(204)
        expect(File.exist?(@asset.storage_info[:identifier])).to be false
      end
    end

    it 'shouldn\'t delete a kuviz for which the user doesn\'t have permissions' do
      delete_json api_v4_kuviz_delete_viz_url(api_key: @user.api_key, id: @kuviz_other_user.id) do |response|
        expect(response.status).to eq(403)
      end
    end

    it 'should return 404 error if kuviz doesn\'t exist' do
      delete_json api_v4_kuviz_delete_viz_url(api_key: @user.api_key, id: '47f41ab4-63de-439f-a826-de5deab14de6') do |response|
        expect(response.status).to eq(404)
      end
    end
  end
end

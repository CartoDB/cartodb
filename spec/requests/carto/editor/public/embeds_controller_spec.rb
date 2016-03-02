require_relative '../../../../spec_helper'
require_relative '../../../../factories/users_helper'

describe Carto::Editor::Public::EmbedsController do
  include_context 'users helper'

  before(:all) do
    @user = FactoryGirl.create(:valid_user)
    @map = FactoryGirl.create(:map, user_id: @user.id)
    @visualization = FactoryGirl.create(:carto_visualization, user_id: @user.id, map_id: @map.id)
  end

  before(:each) do
    Carto::Visualization.any_instance.stubs(:organization?).returns(false)
  end

  after(:all) do
    @map.destroy
    @visualization.destroy
    @user.destroy
  end

  describe '#show' do
    it 'embeds visualizations' do
      get editor_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.include?(@visualization.name).should be true
    end

    it 'defaults to generate vizjson with vector=false' do
      get editor_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.should include('\"vector\":false')
    end

    it 'generates vizjson with vector=true with flag' do
      get editor_visualization_public_embed_url(visualization_id: @visualization.id, vector: true)

      response.status.should == 200
      response.body.should include('\"vector\":true')
    end

    it 'does not embed private visualizations' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
      @visualization.save

      get editor_visualization_public_embed_url(visualization_id: @visualization.id)

      response.body.include?('Embed error | CartoDB').should be true
      response.status.should == 403
    end

    it 'does not embed password protected viz' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      get editor_visualization_public_embed_url(visualization_id: @visualization.id)

      response.body.include?('Protected map').should be true
      response.status.should == 403
    end

    it 'returns 404 for inexistent visualizations' do
      get editor_visualization_public_embed_url(visualization_id: UUIDTools::UUID.timestamp_create.to_s)

      response.status.should == 404
    end
  end

  describe '#show_protected' do
    it 'rejects incorrect passwords' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      Carto::Visualization.any_instance.stubs(:has_password?).returns(true)
      Carto::Visualization.any_instance.stubs(:password_valid?).with('manolo').returns(false)

      post editor_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: 'manolo')

      response.body.include?('The password is not ok').should be true
      response.status.should == 403
    end

    it 'accepts correct passwords' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      Carto::Visualization.any_instance.stubs(:has_password?).returns(true)
      Carto::Visualization.any_instance.stubs(:password_valid?).with('manolo').returns(true)

      post editor_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: 'manolo')

      response.body.include?('The password is not ok').should_not be true
      response.body.include?(@visualization.name).should be true
      response.status.should == 200
    end
  end
end

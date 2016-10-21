require_relative '../../../../spec_helper'
require_relative '../../../../factories/organizations_contexts.rb'

describe Carto::Builder::Public::EmbedsController do
  include Warden::Test::Helpers

  before(:all) do
    @user = FactoryGirl.create(:valid_user)
    @map = FactoryGirl.create(:map, user_id: @user.id)
    @visualization = FactoryGirl.create(:carto_visualization, user_id: @user.id, map_id: @map.id, version: 3)
    # Only mapcapped visualizations are presented by default
    Carto::Mapcap.create!(visualization_id: @visualization.id)
  end

  before(:each) do
    Carto::Visualization.any_instance.stubs(:organization?).returns(false)
    Carto::Visualization.any_instance.stubs(:get_auth_tokens).returns(['trusty_token'])
  end

  after(:all) do
    @map.destroy
    @visualization.destroy
    User[@user.id].destroy
  end

  describe '#show' do
    it 'does not display visualizations without mapcaps' do
      unpublished_visualization = FactoryGirl.create(:carto_visualization, user_id: @user.id, map_id: @map.id, version: 3)
      get builder_visualization_public_embed_url(visualization_id: unpublished_visualization.id)
      response.status.should == 404

      unpublished_visualization.destroy
    end

    it 'embeds visualizations' do
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.include?(@visualization.name).should be true
    end

    it 'redirects to builder for v2 visualizations' do
      Carto::Visualization.any_instance.stubs(:version).returns(2)
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 302
    end

    it 'defaults to generate vizjson with vector=false' do
      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.status.should == 200
      response.body.should include('\"vector\":false')
    end

    it 'generates vizjson with vector=true with flag' do
      get builder_visualization_public_embed_url(visualization_id: @visualization.id, vector: true)

      response.status.should == 200
      response.body.should include('\"vector\":true')
    end

    it 'does not include auth tokens for public/link visualizations' do
      get builder_visualization_public_embed_url(visualization_id: @visualization.id, vector: true)

      response.status.should == 200
      response.body.should include("var authTokens = JSON.parse('null');")
    end

    it 'does not embed password protected viz' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      get builder_visualization_public_embed_url(visualization_id: @visualization.id)

      response.body.include?('Protected map').should be true
      response.status.should == 403
    end

    it 'returns 404 for inexistent visualizations' do
      get builder_visualization_public_embed_url(visualization_id: UUIDTools::UUID.timestamp_create.to_s)

      response.status.should == 404
    end

    describe 'private visualizations' do
      it 'cannot be embedded' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @visualization.save

        get builder_visualization_public_embed_url(visualization_id: @visualization.id)

        response.body.include?('Embed error | CARTO').should be true
        response.status.should == 404
      end

      it 'can be embedded if logged in' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @visualization.save

        login_as(@user)
        get builder_visualization_public_embed_url(visualization_id: @visualization.id)

        response.status.should == 200
        response.body.should include @visualization.name
      end

      it 'include auth tokens in embed' do
        @visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @visualization.save

        login_as(@user)
        get builder_visualization_public_embed_url(visualization_id: @visualization.id)

        response.status.should == 200
        response.body.should include @visualization.name

        @user.reload
        auth_tokens = @user.get_auth_tokens
        auth_tokens.each { |token| response.body.should include token }
      end
    end

    describe 'in organizations' do
      include_context 'organization with users helper'

      before(:each) do
        @org_map = FactoryGirl.create(:map, user_id: @org_user_owner.id)
        @org_visualization = FactoryGirl.create(:carto_visualization, user: @carto_org_user_owner, map_id: @org_map.id, version: 3)
        @org_visualization.privacy = Carto::Visualization::PRIVACY_PRIVATE
        @org_visualization.save

        # Only mapcapped visualizations are presented by default
        Carto::Mapcap.create!(visualization_id: @org_visualization.id)

        share_visualization(@org_visualization, @org_user_1)
        Carto::Visualization.any_instance.unstub(:organization?)
        Carto::Visualization.any_instance.stubs(:needed_auth_tokens).returns([])
      end

      it 'does not embed private visualizations' do
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 404
        response.body.should include 'Embed error | CARTO'
      end

      it 'embeds private visualizations if logged in as allowed user' do
        login_as(@org_user_1)
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 200
        response.body.should include @org_visualization.name
      end

      it 'returns 403 for private visualizations if logged in is not an allowed user' do
        login_as(@org_user_2)
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id)

        response.status.should == 404
        response.body.should include 'Embed error | CARTO'
      end

      it 'includes auth tokens for privately shared visualizations' do
        login_as(@org_user_1)
        get builder_visualization_public_embed_url(visualization_id: @org_visualization.id, vector: true)

        response.status.should == 200
        @org_user_1.reload
        auth_tokens = @org_user_1.get_auth_tokens
        auth_tokens.count.should eq 2
        auth_tokens.each { |token| response.body.should include token }
      end
    end
  end

  describe '#show_protected' do
    it 'rejects incorrect passwords' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      Carto::Visualization.any_instance.stubs(:has_password?).returns(true)
      Carto::Visualization.any_instance.stubs(:password_valid?).with('manolo').returns(false)

      post builder_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: 'manolo')

      response.body.include?('Invalid password').should be true
      response.status.should == 403
    end

    it 'accepts correct passwords' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      Carto::Visualization.any_instance.stubs(:has_password?).returns(true)
      Carto::Visualization.any_instance.stubs(:password_valid?).with('manolo').returns(true)

      post builder_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: 'manolo')

      response.body.include?('The password is not ok').should_not be true
      response.body.include?(@visualization.name).should be true
      response.status.should == 200
    end

    it 'includes auth tokens' do
      @visualization.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @visualization.save

      Carto::Visualization.any_instance.stubs(:has_password?).returns(true)
      Carto::Visualization.any_instance.stubs(:password_valid?).with('manolo').returns(true)

      post builder_visualization_public_embed_protected_url(visualization_id: @visualization.id, password: 'manolo')

      response.status.should == 200
      @visualization.get_auth_tokens.each { |token| response.body.should include token }
    end
  end
end

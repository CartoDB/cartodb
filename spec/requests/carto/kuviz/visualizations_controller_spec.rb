
require_relative '../../../spec_helper'
require_relative '../../../factories/users_helper'

describe Carto::Kuviz::VisualizationsController do
  include Warden::Test::Helpers

  after(:all) do
    FileUtils.rmtree(Carto::Conf.new.public_uploads_path() + '/tests')
  end

  describe '#show' do
    before(:each) do
      @kuviz = FactoryGirl.create(:kuviz_visualization)
      @kuviz.save
      @asset = Carto::Asset.for_visualization(visualization: @kuviz,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      login(@kuviz.user)
    end

    it 'shows public kuviz' do
      get kuviz_show_url(id: @kuviz.id)

      response.status.should eq 200
      response.body.scan(/test/).present?.should == true
    end

    it 'shows 404 on non-existent kuviz' do
      get kuviz_show_url(id: 'fake-uuid')

      response.status.should eq 404
    end

    it 'shows password protected kuviz' do
      @kuviz.privacy = Carto::Visualization::PRIVACY_PROTECTED
      @kuviz.password = 'test'
      @kuviz.save

      get kuviz_show_url(id: @kuviz.id)

      response.status.should eq 200
      response.body.scan(/Insert your password/).present?.should == true
    end
  end

  describe '#show_protected' do
    before(:each) do
      @kuviz = FactoryGirl.create(:kuviz_protected_visualization)
      @kuviz.save
      @asset = Carto::Asset.for_visualization(visualization: @kuviz,
                                              resource: StringIO.new('<html><body>test</body></html>'))
      @asset.save
      login(@kuviz.user)
    end

    it 'shows password error message is the password is incorrect' do
      post kuviz_password_protected_url(id: @kuviz.id), password: 'wrong_password'

      response.status.should eq 200
      response.body.scan(/Invalid password/).present?.should == true
    end

    it 'shows 404 if the kuviz is not password protected' do
      @kuviz.password=''
      @kuviz.privacy = Carto::Visualization::PRIVACY_PUBLIC
      @kuviz.save
      post kuviz_password_protected_url(id: @kuviz.id), password: 'wrong_password'

      response.status.should eq 404
    end

    it 'shows password protected kuviz' do
      post kuviz_password_protected_url(id: @kuviz.id), password: 'test'

      response.status.should eq 200
      response.body.scan(/<body>test<\/body>/).present?.should == true
    end
  end
end

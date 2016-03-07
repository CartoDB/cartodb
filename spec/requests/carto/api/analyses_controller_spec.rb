require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'

describe Carto::Api::AnalysesController do
  include Carto::Factories::Visualizations
  include HelperMethods

  describe '#show' do
    let(:user) do
      FactoryGirl.create(:carto_user)
    end

    before(:each) do
      @map, @table, @table_visualization, @visualization = create_full_visualization(user)
    end

    after(:each) do
      destroy_full_visualization(@map, @table, @table_visualization, @visualization)
      user.destroy
    end

    def get_analysis_url(user, visualization, analysis)
      analysis_url(
        user_domain: user.username,
        api_key: user.api_key,
        visualization_id: visualization.id,
        id: analysis.id)
    end

    it 'returns existing analysis' do
      analysis = FactoryGirl.create(:source_analysis, visualization_id: @visualization.id, user_id: user.id)

      get_json get_analysis_url(user, @visualization, analysis) do |response|
        response.status.should eq 200
        response[:body].should eq analysis.params_json
      end

      analysis.destroy
    end
  end

end

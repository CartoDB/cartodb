require 'spec_helper_min'
require 'support/helpers'
require 'factories/carto_visualizations'

describe Carto::Api::StatesController do
  include Carto::Factories::Visualizations
  include HelperMethods

  let(:state) do
    {
      "map": {
        "center": [40.59896507038094, -73.69937896728516],
        "zoom": 12
      },
      "widgets":
      {
        "314accaf-61e7-4a37-803d-c1dd6ffaafed": {
          "acceptedCategories": ["Manolo,Escobar"]
        },
        "fc4d1354-1de7-490f-a3cc-bc95614177e6": {
          "min": 29.04,
          "max": 36.31
        }
      }
    }
  end

  before(:all) do
    FactoryGirl.create(:carto_feature_flag, name: 'editor-3', restricted: false)

    @user = FactoryGirl.create(:carto_user)
    @intruder = FactoryGirl.create(:carto_user)

    @map, @table, @table_visualization, @visualization = create_full_visualization(@user)
    @state = Carto::State.create(visualization_id: @visualization.id, user_id: @user.id)
  end

  before(:each) { bypass_named_maps }

  after(:all) do
    Carto::FeatureFlag.where(name: 'editor-3').first.destroy

    destroy_full_visualization(@map, @table, @table_visualization, @visualization)

    @user.destroy
    @intruder.destroy
  end

  def state_should_be_correct(response)
    response.body.should eq @state.json
  end

  describe '#update' do
    def update_state_url(user: @user, visualization: @visualization)
      state_url(
        user_domain: user.subdomain,
        visualization_id: visualization.id,
        api_key: user.api_key
      )
    end

    it 'update a state' do
      put update_state_url, json: state do |response|
        response.status.should eq 200

        state_should_be_correct(response)
      end
    end

    it 'returns 403 if user does not own the visualization' do
      put update_state_url(user: @intruder), {} do |response|
        response.status.should eq 403

        response.body.should be_empty
      end
    end
  end
end

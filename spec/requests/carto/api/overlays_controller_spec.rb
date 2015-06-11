# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/overlays_controller'
require_relative '../../../../spec/requests/api/json/overlays_controller_shared_examples'


describe Carto::Api::OverlaysController do

  it_behaves_like 'overlays controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays'     => 'overlays#index',    as: :api_v1_visualizations_overlays_index,  constraints: { visualization_id: /[^\/]+/ }
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/viz/:visualization_id/overlays/:id' => 'overlays#show',     as: :api_v1_visualizations_overlays_show,   constraints: { visualization_id: /[^\/]+/ }
      end

      # old controller
      scope :module => 'api/json', :format => :json do
      end

    end

  end

  after(:all) do
    Rails.application.reload_routes!
  end

end

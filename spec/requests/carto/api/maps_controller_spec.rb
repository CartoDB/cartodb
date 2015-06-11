# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/maps_controller'
require_relative '../../../../spec/requests/api/json/maps_controller_shared_examples'


describe Carto::Api::MapsController do

  it_behaves_like 'maps controllers' do
  end

  before(:all) do

    # Spec the routes so that it uses the new controller. Needed for alternative routes testing
    Rails.application.routes.draw do

      # new controller
      scope :module => 'carto/api', :format => :json do
        get '(/user/:user_domain)(/u/:user_domain)/api/v1/maps/:id'  => 'maps#show',    as: :api_v1_maps_show
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

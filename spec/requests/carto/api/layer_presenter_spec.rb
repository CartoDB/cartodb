# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/layer_presenter'
require_relative '../../api/json/layer_presenter_shared_examples'

describe "Carto::Api::LayersController - Layer Model" do
  it_behaves_like 'layer presenters', Carto::Api::LayerPresenter, ::Layer
end

describe "Carto::Api::LayersController - Carto::Layer" do
  it_behaves_like 'layer presenters', Carto::Api::LayerPresenter, Carto::Layer
end

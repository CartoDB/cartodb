# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/controllers/carto/api/layer_presenter'
require_relative '../../api/json/layer_presenter_shared_examples'

describe Api::Json::LayersController do
  it_behaves_like 'layer presenters', Carto::Api::LayerPresenter

end
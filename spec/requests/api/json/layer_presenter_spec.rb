# encoding: utf-8

require_relative '../../../spec_helper'
require_relative '../../../../app/models/layer/presenter'
require_relative 'layer_presenter_shared_examples'

describe Api::Json::LayersController do
  # Old presenter, old model
  it_behaves_like 'layer presenters', CartoDB::Layer::Presenter, ::Layer
end
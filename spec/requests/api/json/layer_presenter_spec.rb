require 'spec_helper_unit'
require_relative '../../../../app/models/layer/presenter'
require_relative 'layer_presenter_shared_examples'

describe CartoDB::LayerModule::Presenter do
  # Old presenter, old model
  it_behaves_like 'layer presenters', CartoDB::LayerModule::Presenter, ::Layer
end

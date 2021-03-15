require_relative '../shared_entity_shared_examples'
require 'spec_helper_min'

describe Carto::SharedEntity do
  it_behaves_like 'shared entity models' do
    def shared_entity_class
      Carto::SharedEntity
    end
  end
end

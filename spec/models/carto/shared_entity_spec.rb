require 'spec_helper_unit'
require_relative '../shared_entity_shared_examples'

describe Carto::SharedEntity do
  it_behaves_like 'shared entity models' do
    def shared_entity_class
      Carto::SharedEntity
    end
  end
end

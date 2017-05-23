# coding: UTF-8
require_relative 'shared_entity_shared_examples'

describe CartoDB::SharedEntity do
  it_behaves_like 'shared entity models' do
    def shared_entity_class
      CartoDB::SharedEntity
    end
  end
end

require 'spec_helper_min'

describe Carto::Api::TablePresenter do
  include CartoDB::Factories
  include_context 'user helper'

  describe '#public_values' do
    it 'should work with a canonical visualizations that has two related tables' do
      # Note: with Builder, this should not happen (canonical visualizations cannot be modified), for compatibility
      # with older, migrated, canonical visualizations
      main_table = create_table(user_id: @user.id)
      aux_table = create_table(user_id: @user.id)

      canonical_layer = main_table.layers.first
      canonical_layer.options["query"] = "SELECT * FROM #{main_table.name} JOIN #{aux_table.name} ON true"
      canonical_layer.save

      context = mock
      context.stubs(request: nil, polymorphic_path: '')

      presentation = Carto::Api::TablePresenter.new(main_table, @user, context).to_poro
      presentation[:table_visualization][:related_tables].count.should eq 1
      presentation[:table_visualization][:related_tables][0][:name].should eq aux_table.name
    end
  end
end

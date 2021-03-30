require 'spec_helper_min'

describe Carto::Api::UserTablePresenter do
  include_context 'user helper'

  describe '#poro' do
    context 'when accessible_dependent_derived_maps is enabled' do
      before(:all) do
        table = create(:carto_user_table, user_id: @user.id)
        visualization = create(:carto_visualization, user_id: @user.id)
        dependencies = [visualization] * 5
        table.stubs(:accessible_dependent_derived_maps).returns(dependencies)
        presenter = Carto::Api::UserTablePresenter.new(table, @user)
        context = mock
        context.stubs(request: nil, polymorphic_path: '')
        @presentation = presenter.to_poro(accessible_dependent_derived_maps: true, context: context)
      end

      it 'includes only 3 dependencies' do
        expect(@presentation[:accessible_dependent_derived_maps].count).to eq 3
      end

      it 'includes the dependencies count' do
        expect(@presentation[:accessible_dependent_derived_maps_count]).to eq 5
      end
    end
  end
end

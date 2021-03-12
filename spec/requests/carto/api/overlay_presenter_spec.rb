require 'ostruct'
require_relative '../../../../app/controllers/carto/api/overlay_presenter'

require 'json'

describe Carto::Api::OverlayPresenter do
  describe '#to_poro' do
    it 'renders a hash representation of an overlay' do
      overlay = OpenStruct.new(
        order:    1,
        type:     'zoom',
        options:  {}
      )

      representation = Carto::Api::OverlayPresenter.new(overlay).to_poro

      representation.fetch(:order)           .should eq overlay.order
      representation.fetch(:type)            .should eq overlay.type
      representation.fetch(:options)         .should eq overlay.options
      representation.fetch(:template)        .should eq overlay.template
      representation.fetch(:id)              .should eq overlay.id
      representation.fetch(:visualization_id).should eq overlay.visualization_id
    end

    it 'renders a hash representation of an overlay for vizjson' do
      overlay = OpenStruct.new(
        order:    1,
        type:     'zoom',
        options:  {}
      )

      representation = Carto::Api::OverlayPresenter.new(overlay).to_vizjson_poro

      representation.fetch(:order)     .should eq overlay.order
      representation.fetch(:type)      .should eq overlay.type
      representation.fetch(:options)   .should eq overlay.options
      representation.fetch(:template)  .should eq overlay.template
      representation[:id]              .should be_nil
      representation[:visualization_id].should be_nil
    end
  end
end

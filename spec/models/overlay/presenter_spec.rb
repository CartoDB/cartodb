# encoding: utf-8
require 'ostruct'
require_relative '../../../app/models/overlay/presenter'

require 'json'

include CartoDB

describe Overlay::Presenter do
  describe '#to_poro' do
    it 'renders a hash representation of an overlay' do
      overlay = OpenStruct.new(
        order:    1,
        type:     'zoom',
        options:  {}
      )

      representation = Overlay::Presenter.new(overlay).to_poro

      representation.fetch(:order)    .should == overlay.order
      representation.fetch(:type)     .should == overlay.type
      representation.fetch(:options)  .should == overlay.options
    end
  end
end


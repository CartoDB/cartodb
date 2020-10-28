require 'spec_helper'

describe BasePresenter do
  class DummyPresenter < BasePresenter

    def self.object_klass
      Carto::Organization
    end

    # rubocop:disable Style/AccessModifierDeclarations
    private(*delegate(*delegated_methods, to: :object))
    # rubocop:enable Style/AccessModifierDeclarations

    def data
      { id: id }
    end

  end

  let(:organization) { create(:carto_organization) }
  let(:presenter) { DummyPresenter.new(organization) }

  it 'delegates basic methods to inner object while keeping them private' do
    expect(presenter.data[:id]).to eq(organization.id)
    expect { presenter.id }.to raise_error(NoMethodError)
  end
end

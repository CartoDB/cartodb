require 'spec_helper_unit'

describe MapViewsCommands::Update do
  let(:command) { described_class.new(params) }

  describe '#run' do
    let!(:user) { create(:carto_user) }
    let(:date) { Date.new(2021, 1, 25) }
    let(:params) do
      {
        date: date,
        data: [
          { user_id: user.id, map_views: 100 }
        ]
      }
    end

    context 'when everything is ok' do
      before { command.run }

      it 'updates the user map views' do
        last_map_view = user.user_map_views.last

        expect(last_map_view.metric_date).to eq(date)
        expect(last_map_view.map_views).to eq(100)
      end
    end
  end
end

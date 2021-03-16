require_relative '../../app/models/carto/state'

FactoryBot.define do
  factory :state, class: Carto::State do
    json do
      {
        map: {
          ne: [-89.81756220409478, -335.39062500000006],
          sw: [89.81302911292107, 97.73437500000001],
          center: [-0.7031073524364783, -118.82812500000001],
          zoom: 1
        }
      }
    end
  end
end

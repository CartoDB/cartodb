FactoryBot.define do
  factory :data_import, class: Carto::DataImport do
    state { 'complete' }
  end
end

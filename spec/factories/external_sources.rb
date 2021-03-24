FactoryBot.define do

  factory :external_source, class: 'Carto::ExternalSource' do
    association :visualization, factory: :carto_visualization, type: 'remote'
    import_url { 'http://www.wadus.com' }
    rows_counted { 1 }
    size { 1 }
  end

end

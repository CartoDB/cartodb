require_relative '../../app/models/carto/external_source'

FactoryGirl.define do

  factory :external_source, class: Carto::ExternalSource do
    before(:create) do |external_source|
      visualization = FactoryGirl.create(:carto_visualization)
      external_source.visualization_id = visualization.id
    end

    import_url 'http://www.wadus.com'
    rows_counted 1
    size 1
  end

end

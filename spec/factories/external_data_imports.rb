require_relative '../../app/models/carto/external_data_import'

FactoryGirl.define do

  factory :full_external_data_import, class: Carto::ExternalDataImport do
    before(:create) do |external_data_import|
      data_import = FactoryGirl.create(:data_import)
      external_data_import.data_import_id = data_import.id
      
      external_source = FactoryGirl.create(:external_source)
      external_data_import.external_source_id = external_source.id
    end
  end

end

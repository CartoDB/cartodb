require_relative '../../app/models/carto/external_data_import'

FactoryGirl.define do

  # Requires data_import_id (because DataImport links a user)
  factory :external_data_import_with_external_source, class: Carto::ExternalDataImport do
    before(:create) do |external_data_import|
      external_source = FactoryGirl.create(:external_source)
      external_data_import.external_source_id = external_source.id
    end
  end

end

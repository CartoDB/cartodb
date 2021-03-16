require_relative '../../app/models/carto/external_data_import'

FactoryBot.define do

  # Requires data_import_id (because DataImport links a user)
  factory :external_data_import_with_external_source, class: Carto::ExternalDataImport do
    external_source
  end

end

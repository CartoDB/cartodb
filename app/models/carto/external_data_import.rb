require 'active_record'

module Carto
  class ExternalDataImport < ActiveRecord::Base
    belongs_to :data_import, class_name: Carto::DataImport
    belongs_to :external_source, class_name: Carto::ExternalSource
    belongs_to :synchronization, class_name: Carto::Synchronization, dependent: :destroy

    def self.by_user_id(user_id)
      user_data_imports = Carto::DataImport.where(user_id: user_id)
      Carto::ExternalDataImport.where(data_import_id: user_data_imports.select(:id)).all
    end

  end
end

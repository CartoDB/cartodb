# encoding: UTF-8

require_relative './data_import'
require_relative './visualization/external_source'

class ExternalDataImport < Sequel::Model
  many_to_one :data_import

  def initialize(data_import_id, external_source_id)
    super({external_source_id: external_source_id, data_import_id: data_import_id})
  end

  def self.by_user_id(user_id)
    user_data_imports = DataImport.where(user_id: user_id)
    ExternalDataImport.where(data_import_id: user_data_imports.select(:id)).all
  end

end

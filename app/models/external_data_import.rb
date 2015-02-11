# encoding: UTF-8

require_relative './data_import'
require_relative './visualization/external_source'

class ExternalDataImport < Sequel::Model

  def initialize(data_import_id, external_source_id)
    super({external_source_id: external_source_id, data_import_id: data_import_id})
  end

end

require_dependency 'cartodb/errors'
require_dependency 'cartodb/import_error_codes'

module Carto::DataImportCommons

  # Notice that this returns the entire error hash, not just the text
  def get_error_text
    if self.error_code == CartoDB::NO_ERROR_CODE
      CartoDB::NO_ERROR_CODE
    elsif self.error_code.blank? || self.error_code == 99999
      connector_error_message || CartoDB::IMPORTER_ERROR_CODES[9999]
    else
      CartoDB::IMPORTER_ERROR_CODES[self.error_code]
    end
  end

  private

  CONNECTOR_ERROR_PATTERN = /Connector Error [^\s]+: ERROR:\s+(.+?)^\d\d\d\d-\d\d-\d\d/mi.freeze

  def connector_error_message
    match = CONNECTOR_ERROR_PATTERN.match(log&.entries)
    match && match[1]
  end

end

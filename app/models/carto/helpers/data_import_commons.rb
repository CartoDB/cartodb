require_dependency 'cartodb/errors'
require_dependency 'cartodb/import_error_codes'

module Carto
  module DataImportCommons

    GENERIC_ERROR_CODE = 99999

    # Notice that this returns the entire error hash, not just the text
    def get_error_text
      if error_code == CartoDB::NO_ERROR_CODE
        CartoDB::NO_ERROR_CODE
      elsif error_code.blank? || error_code == GENERIC_ERROR_CODE
        connector_error_message || CartoDB::IMPORTER_ERROR_CODES[GENERIC_ERROR_CODE]
      else
        CartoDB::IMPORTER_ERROR_CODES[error_code]
      end
    end

    private
    CONNECTOR_ERROR_PATTERN = /Connector(?:Runner)? Error(?:[^\s]+: ERROR:)?\s+(.+?)^\d\d\d\d-\d\d-\d\d/mi.freeze
    GENERAL_ERROR_PATTERN = /Exception:\s+(.+?)^\d\d\d\d-\d\d-\d\d/mi.freeze

    def connector_error_message
      match = CONNECTOR_ERROR_PATTERN.match(log&.entries) || GENERAL_ERROR_PATTERN.match(log&.entries)
      return unless match.present?

      {
        title: 'Connector Error',
        what_about: match[1],
        source: CartoDB::ERROR_SOURCE_CARTODB # FIXME, should it typically be ERROR_SOURCE_USER ?
      }
    end

  end
end

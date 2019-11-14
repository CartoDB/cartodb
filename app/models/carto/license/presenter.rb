module Carto
  class LicensePresenter
    def initialize(license)
      @license = license
    end

    def to_poro
      {
        id:        @license.id,
        name:      @license.name
      }
    end
  end
end


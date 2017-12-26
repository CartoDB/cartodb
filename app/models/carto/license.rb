module Carto

  class License

    MIT_LICENSE = :mit
    GPLV2_LICENSE = :gplv2
    GPLV3_LICENSE = :gplv3
    APACHE_LICENSE = :apache
    PDDL_LICENSE = :pddl
    CC_0 = :cc_0
    CC_BY_LICENSE = :cc_by
    CC_BY_NC_LICENSE = :cc_by_nc
    CC_BY_SA_LICENSE = :cc_by_sa
    CC_BY_ND_LICENSE = :cc_by_nd
    CC_BY_NC_SA_LICENSE = :cc_by_nc_sa
    CC_BY_NC_ND_LICENSE = :cc_by_nc_nd
    PUBLIC_DOMAIN_LICENSE = :public_domain
    OPEN_GOVERNMENT_LICENSE = :open_government

    LICENSE_VALUES = {
      MIT_LICENSE => { id: MIT_LICENSE, name: 'MIT' },
      APACHE_LICENSE => { id: APACHE_LICENSE, name: 'Apache license' },
      GPLV3_LICENSE => { id: GPLV3_LICENSE, name: 'GPLv3 license' },
      GPLV2_LICENSE => { id: GPLV2_LICENSE, name: 'GPLv2 license' },
      PDDL_LICENSE => { id: PDDL_LICENSE, name: 'Public Domain Dedication and License' },
      CC_0 => { id: CC_0, name: 'CC0: CC Public domain' },
      CC_BY_LICENSE => { id: CC_BY_LICENSE, name: 'CC BY: Attribution alone' },
      CC_BY_NC_LICENSE => { id: CC_BY_NC_LICENSE, name: 'CC BY-NC: Attribution + Noncommercial' },
      CC_BY_SA_LICENSE => { id: CC_BY_SA_LICENSE, name: 'CC BY-SA: Attribution + ShareAlike' },
      CC_BY_ND_LICENSE => { id: CC_BY_ND_LICENSE, name: 'CC BY-ND: Attribution + NoDerivatives' },
      CC_BY_NC_SA_LICENSE => { id: CC_BY_NC_SA_LICENSE, name: 'CC BY-NC-SA: Attribution + Noncommercial + ShareAlike' },
      CC_BY_NC_ND_LICENSE => { id: CC_BY_NC_ND_LICENSE, name: 'CC BY-NC-ND: Attribution + Noncommercial + NoDerivatives' },
      PUBLIC_DOMAIN_LICENSE => { id: PUBLIC_DOMAIN_LICENSE, name: 'Public domain' },
      OPEN_GOVERNMENT_LICENSE => { id: OPEN_GOVERNMENT_LICENSE, name: 'Open Government License' }
    }

    attr_reader :id, :name

    private_class_method :new

    def self.find(license_id)
      if !license_id.nil?  && !license_id.empty? && LICENSE_VALUES.has_key?(license_id)
        data = LICENSE_VALUES[license_id]
        license = new(data[:id], data[:name])
        license
      else
        return nil
      end
    end

    def self.all
      values = []
      LICENSE_VALUES.each do |k, v|
        values << find(k)
      end
      values
    end

    private

    attr_writer :id, :name

    def initialize(id, name)
      self.id = id
      self.name = name
    end
  end
end

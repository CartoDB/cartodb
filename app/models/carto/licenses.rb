module Carto

  class License

    MIT_LICENSE = :mit
    GPLV2_LICENSE = :gplv2
    GPLV3_LICENSE = :gplv3
    APACHE_LICENSE = :apache

    # TODO Add more license when we know what licenses we want to include here
    LICENSE_VALUES = {
      MIT_LICENSE => { :id => MIT_LICENSE, :name => 'MIT'},
      APACHE_LICENSE => { :id => APACHE_LICENSE, :name => 'Apache license'},
      GPLV3_LICENSE => { :id => GPLV3_LICENSE, :name => 'GPLv3 license'},
      GPLV2_LICENSE => { :id => GPLV2_LICENSE, :name => 'GPLv2 license'}
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

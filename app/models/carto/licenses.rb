module Carto

  class License

    MIT_LICENSE = :mit
    GPLV2_LICENSE = :gplv2
    GPLV3_LICENSE = :gplv3
    APACHE_LICENSE = :apache

    # TODO Add more license when we know what licenses we want to include here
    LICENSE_VALUES = {
      :mit => { :name => 'MIT', :image_url => 'https://upload.wikimedia.org/wikipedia/commons/f/f8/License_icon-mit-88x31-2.svg'},
      :apache => { :name => 'Apache license', :image_url => ''},
      :gplv3 => { :name => 'GPLv3 license', :image_url => 'https://upload.wikimedia.org/wikipedia/commons/8/8b/License_icon-gpl-2.svg'},
      :gplv2 => { :name => 'GPLv2 license', :image_url => 'https://upload.wikimedia.org/wikipedia/commons/8/8b/License_icon-gpl-2.svg'}
    }

    attr_reader :id, :name, :image_url

    private_class_method :new

    def self.get(license_id)
      if !license_id.nil?  && !license_id.empty? && LICENSE_VALUES.has_key?(license_id)
        data = LICENSE_VALUES[license_id]
        license = new(license_id, data[:name], data[:image_url])
        license
      else
        return nil
      end
    end

    private

    attr_writer :id, :name, :image_url

    def initialize(id, name, image_url='')
      self.id = id
      self.name = name
      self.image_url = image_url
    end
  end
end

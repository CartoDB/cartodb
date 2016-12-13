module StorageHelper
  def bypass_storage(identifier: 'es/co/bar.png', url: "https://manolo.es/#{identifier}")
    Carto::StorageOptions::S3.stubs(:conf).returns(Hash.new)
    Carto::StorageOptions::Local.any_instance
                                .stubs(:upload)
                                .returns([identifier, url])
    Carto::StorageOptions::Local.any_instance.stubs(:remove)
  end
end

module StorageHelper

  def bypass_storage(identifier: 'es/co/bar.png', url: "https://manolo.es/#{identifier}")
    Carto::Storage.instance.stubs(:s3_enabled?).returns(false)
    allow_any_instance_of(Carto::StorageOptions::Local).to receive(:upload).and_return([identifier, url])
    allow_any_instance_of(Carto::StorageOptions::Local).to receive(:remove)
  end

end

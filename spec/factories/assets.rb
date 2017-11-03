FactoryGirl.define do
  factory :asset do
    to_create(&:save)

    public_url 'https://manolo.es/es/co/bar.png'
  end

  factory :carto_asset, class: Carto::Asset do
    public_url 'https://manolo.es/es/co/bar.png'
  end

  factory :organization_asset, class: Carto::Asset do
    storage_info do
      {
        type: 'local',
        location: 'manolo_folder',
        identifier: 'could_be_a_manolo_hash_23as4g5sh6sd7hd8j9jfgk'
      }
    end

    public_url 'https://manolo.es/es/co/bar.png'
  end
end

FactoryGirl.define do
  factory :asset do
    asset_file { (Rails.root + 'db/fake_data/simple.json').to_s }
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

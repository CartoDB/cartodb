FactoryGirl.define do
  factory :api_key_apis, class: Carto::ApiKey do
    type Carto::ApiKey::TYPE_REGULAR
    name { unique_name('regular api key for apis') }
    grants [
             {
               type: "apis",
               apis: ["sql", "maps"]
             }
           ]
  end
end

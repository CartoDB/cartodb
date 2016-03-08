FactoryGirl.define do

  factory :table, class: Table do
  end

  factory :user_table, class: UserTable do
    name { String.random(5).downcase }
  end

  factory :carto_user_table, class: Carto::UserTable do
    name { String.random(5).downcase }
  end

end

# encoding: utf-8

FactoryGirl.define do

  factory :carto_group, :class => Carto::Group do
    name 'A_Group'
    display_name 'A Group'
    database_role 'database_role'
  end

  factory :random_group, :class => Carto::Group do |g|
    name { "g_#{String.random(4)}" }
    display_name  { "Group #{g.name}" }
    database_role { "database_role_#{g.name}" }
  end

end

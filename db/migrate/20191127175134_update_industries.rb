require 'carto/db/migration_helper'

include Carto::Db::MigrationHelper

migration(
  Proc.new do
    run "UPDATE users SET industry = 'Retail' WHERE industry = 'Apparel & Fashion'"
    run "UPDATE users SET industry = 'Banking and Financial Services' WHERE industry = 'Banking & Financial Services'"
    run "UPDATE users SET industry = 'Consulting' WHERE industry = 'Business Services'"
    run "UPDATE users SET industry = 'Consulting' WHERE industry = 'Consulting Services'"
    run "UPDATE users SET industry = 'Retail' WHERE industry = 'Consumer & Retail'"
    run "UPDATE users SET industry = 'Education and Research' WHERE industry = 'Education & Research'"
    run "UPDATE users SET industry = 'Mining' WHERE industry = 'Energy & Mining'"
    run "UPDATE users SET industry = 'Cities and Government' WHERE industry = 'Government'"
    run "UPDATE users SET industry = 'Health and Medical' WHERE industry = 'Health & Medical'"
    run "UPDATE users SET industry = 'Marketing and Advertising' WHERE industry = 'Marketing & Advertising'"
    run "UPDATE users SET industry = 'Natural Resources and Environment' WHERE industry = 'Natural Resources & Environment'"
    run "UPDATE users SET industry = 'Software and Tech' WHERE industry = 'Software & Technology'"
    run "UPDATE users SET industry = 'Transport and Logistics' WHERE industry = 'Transportation & Logistics'"
    run "UPDATE users SET industry = 'Utilities' WHERE industry = 'Utilities & Communications'"
  end,
  Proc.new do
  end
)

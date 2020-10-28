# Script to gather lines of code in Sequel Models
#
# Usage:
#   ruby script/sequel-model-lines.rb
#
# The output is left in OUTPUT_FILE as a CSV
# Check constants for customizations.

require 'date'
require 'csv'
require 'fileutils'

START_DATE = Date.new(2015, 3, 1).freeze
END_DATE = Date.today.freeze

OUTPUT_FILE = '/tmp/sequel-loc.csv'
CHECKOUT_TEMP_DIR = '/tmp/sequel-loc'

begin
  # Use a fresh clone
  system "git clone https://github.com/CartoDB/cartodb.git #{CHECKOUT_TEMP_DIR}"
  # Here's how to use the local repo instead of cloning through network
  #src_dir = `git rev-parse --show-toplevel`.strip
  #system "git clone #{src_dir} #{CHECKOUT_TEMP_DIR}"

  Dir.chdir(CHECKOUT_TEMP_DIR) do

    CSV.open(OUTPUT_FILE, 'w') do |csv|
      # csv header
      csv << ['date', 'commit', 'loc']

      # Iterate by months
      date = START_DATE
      while date <= END_DATE do
        # checkout specific revision
        revision = `git rev-list -1 --before="#{date.to_s}" origin/master`.strip
        system 'git clean -df' || exit
        system "git checkout #{revision}" || exit

        # Calculate lines of code of Sequel models
        loc = `git grep -l 'class.*Sequel::Model' -- app/models | xargs cat | wc -l`.strip.to_i

        csv << [date.to_s, revision, loc] unless loc == 0
        date = date.next_month
      end
    end

  end
ensure
  FileUtils.remove_dir(CHECKOUT_TEMP_DIR, _force=true)
end

# Support to dynamic CartoGears loading
# Inspired by BootInquirer at https://github.com/taskrabbit/rails_engines_example/blob/17b5ee5286c2186951312cbe440b8d21738596eb/lib/boot_inquirer.rb
module Carto
  class CartoGearsSupport
    # Returns gears found at:
    # - `/gears`. Should be "installed" (added to `Gemfile.lock``)
    # - `/private_gears` (shouldn't be installed)
    def gears
      (public_gears + private_gears)
    end

    private

    def public_gears
      Dir['gears/*/*.gemspec'].map { |gemspec_file| gear_from_gemspec_file(gemspec_file, true) }
    end

    def private_gears
      Dir['private_gears/*/*.gemspec'].map { |gemspec_file| gear_from_gemspec_file(gemspec_file, false) }
    end

    def gear_from_gemspec_file(gemspec_file, install)
      Carto::Gear.new(File.basename(gemspec_file, File.extname(gemspec_file)), File.dirname(gemspec_file), install)
    end
  end

  class Gear
    def initialize(gem_name, path, install)
      @name = gem_name.dup.freeze
      @path = path.dup.freeze
      @install = install
    end

    attr_reader :name, :path, :install

    def engine
      module_name = @name.classify
      module_name << 's' if @name[-1] == 's'
      "#{module_name}::Engine".constantize
    end
  end
end

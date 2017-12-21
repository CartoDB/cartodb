# Support to dynamic CartoGears loading
# Inspired by BootInquirer at https://github.com/taskrabbit/rails_engines_example/blob/17b5ee5286c2186951312cbe440b8d21738596eb/lib/boot_inquirer.rb
module Carto
  class CartoGearsSupport
    # Returns gears found at:
    # - `/gears`. Should be "installed" (added to `Gemfile.lock``)
    # - `/private_gears` (shouldn't be installed)
    # Returns install gears first.
    def gears
      (public_gears + private_gears).sort { |a, _| a.installable ? -1 : 1 }
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
    def initialize(gem_name, path, installable)
      @name = gem_name.dup.freeze
      @path = path.dup.freeze
      @installable = installable
    end

    # path should only be used from CARTO Gemfile, because Rails is not yet available and relative path is good enough.
    # If you need access to the gear path, use full_path instead.
    attr_reader :name, :path, :installable

    def engine
      module_name = @name.classify
      module_name << 's' if @name[-1] == 's'
      "#{module_name}::Engine".constantize
    end

    def gemspec
      pwd = Dir.pwd
      Dir.chdir(path)
      Gem::Specification::load("#{name}.gemspec")
    ensure
      Dir.chdir(pwd)
    end

    def full_path
      Rails.root.join(path)
    end
  end
end

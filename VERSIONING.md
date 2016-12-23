## VERSIONS

CARTO follows semantic versioning (http://semver.org/)

* **Patch** versions like 4.0.**6** are reserved only for fixes that don't require any additional operations and are fully compatible with the previous patch version
* **Minor** versions like 4.**1**.0 are reserved for changes related to features and bugfixes that may require some additional simple operations like running a rake task
* **Major** versions like **5.**.0.0 are reserved for big changes like refactors, re-designs or important models changes that are not easy to rollback without specific manual actions

## BRANCHES

Any type of commit must pass through a PR in order to eventually get merged to master. For more info about contributing, please check CONTRIBUTING.md file

Master branch will always contain features and bugfixes that are reviewed and accepted through a PR. Changes in master will always be reported in NEWS.md and only major/minor versions will be added. This means that in master branch there will be versions like 4.0.0, 4.1.0, 4.2.0, etc.. Bugfixes versions won't be increased in master branch.

Two consecutive minor versions will be always maintained at the same time. This means that there may be a branch for version 4.0.x and a branch for version 4.1.x. Only critical bugfixes will be added to the newest maintained branch. Very critical security bugfixes will be added to the legacy maintained branch.

Every release in the maintained minor branches will be announced in the NEWS.md file pointing specifically the changes since the last bugfix version.

NEWS.md files of master branch and maintained minor versions branches won't be merged each other in any case.

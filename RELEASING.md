## How to release a new CartoDB.js version

1. [Release a new version](#release-a-new-version)
2. [Rollback to a previous version](#rollback-to-a-previous-version)

---

### Release a new version

- First of all: **MAKE SURE ALL THE TESTS ARE GREEN.**
- Then install the dependencies, follow main README.md instructions.
- Be sure you have a valid secrets.json file (DON'T SHARE IT).
- Create a new branch to prepare the release.

```
git flow release start 3.11.25
```

- Build CartoDB.js files choosing the new version:

```
grunt build
```

- Update the NEWS file and commit the changes. Take into account that new CartoDB.js version will be replaced in ```API.md```, ```RELEASING.md```, ```README.md```, ```package.json```, ```cartodb.js``` and ```examples``` files.

```
git commit -am "Files changed for version 3.11.25"
```

- Release it.

```
grunt publish
```

- Check if those files have been updated in the CDN:
```
http://libs.cartocdn.com.s3.amazonaws.com/cartodb.js/v3/3.11.25/cartodb.js
http://libs.cartocdn.com/cartodb.js/v3/3.11.25/cartodb.js
http://libs.cartocdn.com.s3.amazonaws.com/cartodb.js/v3/3.11/cartodb.js
http://libs.cartocdn.com/cartodb.js/v3/3.11/cartodb.js
```
- Sometimes It takes more than 10 minutes, if it is not updated, execute ``grunt invalidate``.

- And to finish: close the release and push it.

```
git flow release finish 3.11.25
git push --all
git push --tags
```

- If possible, don't forget to change CartoDB.js docs.

- Done. Celebrate! :)

---



### Rollback to a previous version

In case you screw up all things, don't worry, rollback cartodb.js to a previous version is fast (you need to setup the environment, read how to do it):

```
git checkout PREVIOUS_VERSION_TAG
grunt build
grunt publish
```

For example, if we are in 3.11.25 and we want to go back to 3.11.22

```
git checkout 3.11.22
grunt build
grunt publish
```


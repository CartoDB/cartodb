## How to contribute to CartoDB.js

First of all, thanks for collaborating (\o/), but before starting we encourage you to read [this guide](https://guides.github.com/activities/contributing-to-open-source/) explained by @github. And then:

1. [Being part of CartoDB.js](#Being part of CartoDB.js)
2. [Filing a ticket](#Filing a ticket)
3. [Pull requesting](#Pull requesting)
4. [Changing documentation](#Changing documentation)


### Being part of CartoDB.js

### Filling a ticket

### Pull requesting

### Changing documentation





In anycase steps should be:

- Create a new branch from 'develop' where your changes will be done.
```
git checkout -b happy-issue
```

- Push those changes and create a new pull request. One of the admins will check and validate those changes.
```
git push origin happy-issue
```

- When changes are in 'master' branch, go there and run the task to generate dist files.
```
grunt build
```

- Push those new dist files into master.
```
git add --all
git commit -am "new dist files for v0.1.1"
git push origin master
```

- Release/Tag this new version with:
```
grunt release
```

- Check new version in https://github.com/CartoDB/cdbui/tags and add release notes if necessary.

- You are done! \o/

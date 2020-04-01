# siminia

## 1. Clone pwa-studio
```
git clone https://github.com/magento-research/pwa-studio/
cd pwa-studio
git checkout release/5.0
cp packages/venia-concept/.env.dist packages/venia-concept/.env
```

## 2. Modify package.json

workspaces:
```

  "workspaces": [
...
    "packages/siminia"
  ],

```

scripts:

```
  "scripts": {
	...
    "watch:siminia": "yarn workspace @simicart/siminia run watch",
    "stage:siminia": "yarn workspace @simicart/siminia run start"
  },
```
## 3. Clone siminia
```
cd  packages
git clone https://github.com/Simicart/siminia
cd siminia
git checkout develop-5.0
yarn install
yarn run build
cd ../..
yarn install
yarn run build
```
## 4. Run watch/stage
To run watch
```
yarn run watch:siminia
```
To run production
```
NODE_ENV=production PORT=8080 yarn run stage:siminia
```

## 5. No HTTPS magento site
In case your magento site is not https (localhost for example), you'd meet the error of:
Protocol "http:" not supported. Expected "https:"
Go and change it at: pwa-studio/packages/pwa-buildpack/lib/Utilities/graphQL.js
Switch the line
```
const { Agent: HTTPSAgent } = require('https');
```
to
```
const { Agent: HTTPSAgent } = require('http');
```
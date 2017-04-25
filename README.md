# Polymon

Seek out Polymer team members and capture them as Polymon!

## Bootstrap development environment

Polymon is a PWA, so most of the code runs in a browser. But, Polymon also uses Firebase for some business logic, persistance and web hosting.

First, ensure that you have the latest Node.js and NPM installed.
Also, ensure the firebase CLI is available globally:

```sh
npm install -g firebase-tools
```

Next, from your project root, install Node.js dependencies:

```sh
npm install
```

Next, you will need at least one Firebase project to deploy to. If you don't
already have one to target, go create one in the Firebase web control panel.

By default, the `.firebaserc` is configured for the official Polymon
deployment environments. If you are creating a your own Firebase project to
deploy to, you will need to update the `.firebaserc` file to reflect your
**project's ID**. For example, if your dev project's ID is `polymon-foo` and your
production project's ID is `polymon-prod`, your `.firebaserc` should look something like:

```json
{
  "projects": {
    "prod": "polymon-prod",
    "dev": "polymon-foo"
  }
}
```

Once you have access to the Firebase project(s), you will need to create two
files for each project you want to work with:

 1. A JSON file that contains your Firebase project's configuration.
 2. A JSON file that contains Service Account credentials that have owner
    access to the Firebase project.

These files should be named based on the alias that corresponds to each
Firebase project in `.firebaserc`. So, for a project with alias `dev` (as in
the example `.firebaserc` above), the files should be named:

 1. `.dev.env.json`
 2. `.dev.service-account.json`

The `.dev.env.json` file should describe a Firebase configuration, and
optionally a Google Analytics configuration; if you're copying these values from
firebase, ensure the keys match:

```json
{
  "firebase": {
    "projectId": "polymon",
    "apiKey": "AIzaSyDBzqU7s3b6hVu309lbYQABJr2xmioiIV0",
    "authDomain": "polymon-foo.firebaseapp.com",
    "databaseURL": "https://polymon-foo.firebaseio.com",
    "storageBucket": "polymon-foo.appspot.com",
    "messagingSenderId": "447537573236"
  },

  "googleAnalytics": {
    "trackingId": "OPTIONAL_TRACKING_ID_HERE"
  }
}
```

If you don't know how to generate a Service Account credential file, please
consult the documentation [here][1].

Once you have completed the above steps, you can now build the project:

```sh
# This will:
# 1. do a clean build of polymon
# 2. clear and generate data on your firebase dev project
# 3. deploy firebase functions, database rules, and hosting files to firebase
gulp --genData --deploy
```

If you want to do a rebuild you can simply just run:
```sh
# clean rebuild
gulp

# dirty rebuild
gulp build
```

If you want to generate data and deploy to prod, you just need to specify the
alias from the `.firebaserc`
```
gulp --genData --deploy --env prod
```

See the `gulpfile.js` for more gulp tasks.

Assuming everything worked, you should be ready to hack on Polymon. Use the
Firebase CLI to serve the compiled source:

```sh
firebase serve
```

To serve the uncompiled version of polymon, change the `hosting.public`
value in `firebase.json` from `build` to `client` before serving.

And then open up a browser to [http://localhost:5000][2] and check it out!

Finally, remember to:
- enable the Google sign-in method in the [Firebase Console][3]
(Authentication -> sign-in method -> Google -> Enable)
- enable the Google Maps Javascript API in the [Google Cloud API Console][4]
(Library -> Google Maps Javascript API -> Enable)

## Building and Deploying

Assuming you have bootstrapped your environment successfully, the following
scripts should also work:

```sh
# Build a bundled and unbundled version of your site. The output goes to
# `./client/build`
./scripts/build.sh

# Deploy your site to Firebase hosting:
./scripts/deploy.sh
```

If you make changes to your Firebase Realtime Database rules, or your
Firebase Functions, you will need to re-deploy them:

```sh
# Deploy the database rules:
firebase deploy --only database

# Deploy the functions:
firebase deploy --only functions
```

[1]: https://firebase.google.com/docs/server/setup#add_firebase_to_your_app
[2]: http://localhost:5000
[3]: https://console.firebase.google.com/
[4]: https://console.developers.google.com/

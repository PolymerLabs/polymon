# Polymon

Seek out Polymer team members and capture them as Polymon!

## Bootstrap development environment

Polymon is a PWA, so most of the code runs in a browser. But, Polymon also uses Firebase for some business logic, persistance and web hosting.

First, ensure that you have the latest Node.js and NPM installed.

Next, from your project root, install Node.js dependencies:

```sh
npm install
```

Then, install your client-side dependencies with `bower`:

```sh
bower install
```

These dependencies will be installed to `./client/bower_components`.

Next, you will need at least one Firebase project to deploy to. If you don't
already have one to target, go create one in the Firebase web control panel.

By default, the `.firebaserc` is configured for the official Polymon
deployment environments. If you are creating a your own Firebase project to
deploy to, you will need to update the `.firebaserc` file to reflect your
project's ID. For example, if your project ID is `polymon-foo`, your
`.firebaserc` should look something like:

```json
{
  "projects": {
    "foo": "polymon-foo"
  }
}
```

Once you have access to the Firebase project(s), you will need to create two
files for each project you want to work with:

 1. A shell file that exports environment variables that correspond to the
    Firebase project's configuration.
 2. A JSON file that contains Service Account credentials that have owner
    access to the Firebase project.

These files should be named based on the alias that corresponds to each
Firebase project in `.firebaserc`. So, for a project with alias `foo` (as in
the example `.firebaserc` above), the files should be named:

 1. `.firebase.foo.env`
 2. `.service-account.foo.json`

NOTE: The name for the Service Account credentials file is actually
arbitrary, but conventionally it will help to name it after the Firebase
project alias as you will probably have to handle more than one such files.
Also, the `.gitignore` is already configured to ignore
`.service-account.*.json`, and you definitely don't want to check in your
Service Account credentials, so...

The `.firebase.foo.env` file should export a Firebase configuration that
looks like this:

```sh
export FIREBASE_APP_NAME=polymon
export FIREBASE_API_KEY=YoUr_ApI_kEy_GoEs_HeRe
export FIREBASE_AUTH_DOMAIN=polymon-dev.firebaseapp.com
export FIREBASE_DATABASE_URL=https://polymon-foo.firebaseio.com
export FIREBASE_STORAGE_BUCKET=polymon-foo.appspot.com
export FIREBASE_SERVICE_ACCOUNT=.service-account.foo.json
```

If you don't know how to generate a Service Account credential file, please
consult the documentation [here][1].

Once you have completed the above steps, there are two scripts you need to
run before you can start working:

```sh
# Generate the seed data in your Firebase Realtime Database
# WARNING: Running this script will delete everything in your database and
# reset it to its initial state!
./scripts/generate-seed-data.sh

# Set the local environment, and generate an appropriate index.html for that
# environment. Replace `foo` with your Firebase project alias:
source ./scripts/set-env.sh foo
```

Finally, you need to make sure that both the Firebase Functions and Firebase
Realtime Database rules are deployed for your project. Use the following
command to deploy these:

```sh
firebase deploy --only functions,database
```

Assuming everything worked, you should be ready to hack on Polymon. Use the
Firebase CLI to start up a web server:

```sh
firebase serve
```

And then open up a browser to [http://localhost:5000][2] and check it out!

## Building and Deploying

Assuming you have bootstraped your envionrment successfully, the following
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

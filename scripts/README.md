# Create an admin account

1. In the Firebase console, open **Project settings > Service accounts** and choose **Generate new private key**.
2. Save the downloaded key outside this repository, for example in `~/keys/`.
3. Set `GOOGLE_APPLICATION_CREDENTIALS` to the full path of that key file.
4. Make sure the account has signed up in Trash Tracker and verified its email.
5. From the repository root, run `node scripts/make-admin.mjs <email>`.

The script sets `admin: true` on the matching `users/{uid}` document. If the document does not exist, it creates it with the citizen role only.

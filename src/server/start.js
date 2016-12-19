/*
Taken from https://developers.google.com/sheets/api/quickstart/nodejs
*/

/* eslint-disable no-console */

const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const GoogleAuth = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_DIR = `${(process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE)}/.credentials/`;
const TOKEN_PATH = `${TOKEN_DIR}/deep-thoughts.json`;

/**
* Print the names and majors of students in a sample spreadsheet:
* https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
*/
function getQuestions(auth) {
  const sheets = google.sheets('v4');
  sheets.spreadsheets.values.get({
    auth,
    spreadsheetId: '1lxo1qiy9aTm49kk_fyZ543IbxhSfYSgboXKBX1yz160',
    range: 'A2:999',
  }, (err, response) => {
    if (err) {
      console.log(`The API returned an error: ${err}`);
      return;
    }
    const rows = response.values;
    if (rows.length === 0) {
      console.log('No data found.');
    } else {
      for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        console.log(row[0]);
      }
    }
  });
}

/**
* Get and store new token after prompting for user authorization, and then
* execute the given callback with the authorized OAuth2 client.
*
* @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
* @param {getEventsCallback} callback The callback to call with the authorized
*     client.
*/
function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url: ', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
* Create an OAuth2 client with the given credentials, and then execute the
* given callback function.
*
* @param {Object} credentials The authorization client credentials.
* @param {function} callback The callback to call with the authorized client.
*/
function authorize(credentials, callback) {
  const clientSecret = credentials.installed.client_secret;
  const clientId = credentials.installed.client_id;
  const redirectUrl = credentials.installed.redirect_uris[0];
  const auth = new GoogleAuth();
  const oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
* Store token to disk be used in later program executions.
*
* @param {Object} token The token to store to disk.
*/
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code !== 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log(`Token stored to ${TOKEN_PATH}`);
}

// Load client secrets from a local file.
fs.readFile('client_secret.json', (err, content) => {
  if (err) {
    console.log(`Error loading client secret file: ${err}`);
    return;
  }

  authorize(JSON.parse(content), getQuestions);
});

/**
 * run_tracker.mjs
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   The main module to run CETracker.
 */

import assert from 'assert';
import stdio from 'stdio';

import ConnectToMongoDB from './db/mongodb_connect.mjs';
import { SetupDB } from './db/update_db.mjs';
import { Debug } from './utils/utils.mjs';
import { RunCoinsTracking } from './coins_tracking.mjs';
import {
  default_db_url,
  default_db_name
} from './utils/constants.mjs';


const argv = stdio.getopt({
  'db_url': {
    'key': 'url',
    'args': 1,
    'description': 'MongoDB database URL',
    'default': process.env['MONGODB_URL'] || default_db_url
  },
  'db_name': {
    'key': 'db_name',
    'args': 1,
    'description': 'MongoDB database name',
    'default': default_db_name
  },
  'host': {
    'key': 'host',
    'args': 1,
    'description': 'Override MongoDB hostname for TLS certificate validation',
    'default': ''
  }
});


// Command Line Arguments:
// -url: MongoDB database URL.
// -db_name: MongoDB database name.
// -host: Override MongoDB hostname for TLS certificate validation.
//
// For example,
// node --experimental-modules run_tracker.mjs --db_name my_mongo_db
function main() {
  ConnectToMongoDB(argv.db_url, argv.db_name, (error, db) => {
    assert.equal(null, error);

    // Create database schemas for exchanges if they do not exist.
    SetupDB(db, (db_error) => {
      if (db_error) {
        Debug(db_error);
      } else {
        console.log('Database setup has been done successfully');
        RunCoinsTracking(db);
      }
    });
  });
}

main();


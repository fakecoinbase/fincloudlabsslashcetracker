/**
 * run_tracker.mjs
 *
 * Copyright (c) 2019, Artiom Baloian
 * All rights reserved.
 *
 * Description:
 *   The main module/file to run.
 */

import assert from 'assert';

import { ConnectToMongoDB } from './db/mongodb_connect.mjs';
import { SetupDB } from './db/update_db.mjs';
import { Debug } from './utils/utils.mjs';
import { RunCoinsTracking } from './coins_tracking.mjs';


function main() {
  ConnectToMongoDB((error, db) => {
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


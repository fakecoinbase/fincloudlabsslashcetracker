import assert from 'assert';
import mongodb from 'mongodb';


function ConnectToMongoDB(callback) {
  const url = 'mongodb://127.0.0.1:27017';
  const options = {
    'poolSize': 64,
    'useNewUrlParser': true,
    'useUnifiedTopology': true,
    'autoReconnect': true,
    'reconnectInterval': 1000,
    'reconnectTries': Number.MAX_VALUE
  };

  mongodb.MongoClient.connect(url, options, (error, client) => {
    assert.equal(null, error);

    const db_name = 'movehash_db';
    const mongo_db = client.db(db_name);
    if (mongo_db) {
      callback(null, mongo_db, client);
    } else {
      callback('MongoDB database connection failed.', null, null);
    }
  });
}

export { ConnectToMongoDB };
export default ConnectToMongoDB;


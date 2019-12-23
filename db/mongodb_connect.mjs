import assert from 'assert';
import mongodb from 'mongodb';
import tls from 'tls';


function ConnectToMongoDB(url, db_name, callback, hostname) {
  const options = {
    sslValidate: true,
    checkServerIdentity: (name, cert) => tls.checkServerIdentity(hostname || name, cert),
    poolSize: 64,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    autoReconnect: true,
    reconnectInterval: 1000,
    reconnectTries: Number.MAX_VALUE
  };

  mongodb.MongoClient.connect(url, options, (error, client) => {
    assert.equal(null, error);

    const mongo_db = client.db(db_name);
    if (mongo_db) {
      callback(null, mongo_db, client);
    } else {
      callback('MongoDB database connection failed.', null, null);
    }
  });
}

export default ConnectToMongoDB;


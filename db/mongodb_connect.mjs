import assert from 'assert';
import mongodb from 'mongodb';
import tls from 'tls';


async function getMongoDB(url, db_name, callback, hostname) {
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

  try {
    const client = await mongodb.MongoClient.connect(url, options);
    const mongo_db = client.db(db_name);
    if (!mongo_db) {
      client.close();
      throw new Error('MonogDB connection failed');
    }
    return mongo_db
  } catch (error) {
    throw new Error(error);
  }
}

export default getMongoDB;


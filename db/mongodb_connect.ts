import mongodb from 'mongodb';
import tls from 'tls';


async function getMongoDB(url: string, db_name: string, hostname: string = '') {
  const options = {
    sslValidate: true,
    checkServerIdentity: (name, cert) => tls.checkServerIdentity(hostname || name, cert),
    poolSize: 64,
    useNewUrlParser: true,
    useUnifiedTopology: true
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


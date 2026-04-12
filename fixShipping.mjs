import { Client, Databases, Query, ID } from 'appwrite';

const client = new Client()
  .setEndpoint('https://cloud.appwrite.io/v1')
  .setProject('6952e922001783db4a09');

const db = new Databases(client);

const DATABASE_ID = '6952ea9400057cd6e1fe';
const COLLECTIONS_STORE_SETTINGS = 'store_settings';

async function updateShipping() {
  try {
    const res = await db.listDocuments(DATABASE_ID, COLLECTIONS_STORE_SETTINGS, [Query.equal('key', 'shipping')]);
    const newOpts = [
      { id: 'inside_dhaka', name: 'Inside Dhaka', price: 60, estimatedDays: '1-2 business days', enabled: true },
      { id: 'outside_dhaka', name: 'Outside Dhaka', price: 120, estimatedDays: '3-5 business days', enabled: true }
    ];
    if(res.documents.length > 0) {
      await db.updateDocument(DATABASE_ID, COLLECTIONS_STORE_SETTINGS, res.documents[0].$id, { value: JSON.stringify(newOpts) });
      console.log('Updated existing document');
    } else {
      await db.createDocument(DATABASE_ID, COLLECTIONS_STORE_SETTINGS, ID.unique(), { key: 'shipping', value: JSON.stringify(newOpts) });
      console.log('Created new document');
    }
  } catch (err) {
    console.error(err);
  }
}

updateShipping();

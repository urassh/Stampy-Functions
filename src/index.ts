import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as geohash from 'ngeohash';

admin.initializeApp();
const db = admin.firestore();

interface LocationRecord {
    id: string;
    user_id: string;
    latitude: number;
    longitude: number;
}

export const findMatchingLocations = functions.https.onRequest(async (req, res) => {
    try {
        const { latitude, longitude } = req.body;

        if (latitude == null || longitude == null) {
            res.status(400).send('Invalid input: latitude and longitude are required.');
            return;
        }

        // 入力位置の GeoHash を計算
        const inputGeoHash: string = geohash.encode(latitude, longitude, 8);

        // Firestore から locations コレクションを取得
        const snapshot = await db.collection('locations').get();
        if (snapshot.empty) {
            res.status(404).send('No locations found.');
            return;
        }

        // マッチする location をフィルタリング
        const matchingLocations: LocationRecord[] = [];
        snapshot.forEach(doc => {
            const data = doc.data() as LocationRecord;
            const docGeoHash: string = geohash.encode(data.latitude, data.longitude, 8);
            if (docGeoHash === inputGeoHash) {
                matchingLocations.push(data);
            }
        });

        if (matchingLocations.length === 0) {
            res.status(404).send('No matching locations found.');
            return;
        }

        res.status(200).json(matchingLocations);
    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).send('Internal Server Error');
    }
});
import {MongoClient} from 'mongodb';

export class MongoConnector {

    static getInstance(): MongoConnector {
        if (!MongoConnector.instance) {
            throw new Error('MongoConnector has no instance. It must be be built before use.');
        }
        return MongoConnector.instance;
    }

    static async build(dbURI: string) {
        const driver = new MongoConnector();
        await driver.connect(dbURI);
        MongoConnector.instance = driver;
    }

    private static instance: MongoConnector;

    public mongoClient: MongoClient;

    private constructor() {
    }

    /**
     * Connect to the database. Must be called before any other functions.
     *
     * NOTE: This function will attempt to connect to the database every
     *       time it is called, but since it assigns the result to a local
     *       variable which can only ever be created once, only one
     *       connection will ever be active at a time.
     */
    async connect(dbURI: string): Promise<void> {
        try {
            this.mongoClient = await MongoClient.connect(dbURI, {
                reconnectTries: 30,
                reconnectInterval: 1000,
            });
        } catch (e) {
            return Promise.reject(
                'Problem connecting to database at ' + dbURI + ':\n\t' + e,
            );
        }
    }

    /**
     * Close the database. Note that this will affect all services
     * and scripts using the database, so only do this if it's very
     * important or if you are sure that *everything* is finished.
     */
    disconnect(): Promise<void> {
        return this.mongoClient.close();
    }
}

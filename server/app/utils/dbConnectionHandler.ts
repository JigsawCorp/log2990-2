import * as mongoose from "mongoose";
import Config from "../config";

export class DbConnectionHandler {

    private static instance: DbConnectionHandler;

    private static readonly DB_URL: string = "mongodb://" + Config.mongodb.username + ":"
                                    + Config.mongodb.password + "@"
                                    + Config.mongodb.hostname + ":"
                                    + Config.mongodb.port + "/"
                                    + Config.mongodb.database;

    public static getInstance(): DbConnectionHandler {
        if (!this.instance) {
            this.instance = new DbConnectionHandler();
        }

        return this.instance;
    }

    public connect(onConnect: Function, onError: Function): void {
        mongoose.connect(DbConnectionHandler.DB_URL, {useNewUrlParser: true}, (err: Error) => {
            if (err) {
               onError(err);
            } else {
                onConnect();
            }
        });
    }

    public async disconnect(): Promise<void> {
        await mongoose.disconnect();
    }

}

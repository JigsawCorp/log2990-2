import * as AWS from "aws-sdk";
import { Request } from "express";
import * as multer from "multer";
import * as multerS3 from "multer-s3";
import * as uuid from "uuid";
import { FileNotFoundException } from "../../../common/errors/fileNotFoundException";
import { S3Exception } from "../../../common/errors/s3Exception";
import Config from "../config";

export class Storage {
    public static readonly STORAGE_PATH: string = "storage";

    public static getPath(guid: string): string {
        return this.STORAGE_PATH + "/" + guid;
    }

    public static generateGUID(): string {
        return uuid.v4().replace(/-/g, "");
    }

    public static async saveBuffer(buffer: ArrayBuffer): Promise<string> {

        const guid: string = this.generateGUID();

        return s3.upload(
            {
                Bucket: Config.s3.bucket,
                Body: Buffer.from(buffer),
                Key: this.getPath(guid),
            },
        ).promise().then(() => {
            return guid;
        }).catch((err: Error) => {
            throw new S3Exception(err.message);
        });
    }
    public static guidFromPath(guid: string): string {
        const split: string[] = guid.split("/");

        return split[split.length - 1];
    }

    public static async openBuffer(guid: string, completePath: boolean): Promise<ArrayBuffer> {
        let path: string;
        (!completePath) ? path = this.getPath(guid) : path = guid;

        return s3.getObject(
            {
                Bucket: Config.s3.bucket,
                Key: path,
            },
        ).promise().then((object: AWS.S3.GetObjectOutput) => {
            return (object.Body as Buffer).buffer;
        }).catch((err: Error) => {
            throw new FileNotFoundException(path);
        });
    }

}

AWS.config.update({
    accessKeyId: Config.s3.key,
    secretAccessKey: Config.s3.secret,
});

const s3: AWS.S3 = new AWS.S3();

export const uploads: multer.Instance = multer({
    storage: multerS3({
        s3: s3,
        bucket: Config.s3.bucket,
        key: (req: Request, file: Express.Multer.File, cb: Function) => {
            const guid: string = Storage.generateGUID();
            cb(null, Storage.getPath(guid));
        },
    }),
});

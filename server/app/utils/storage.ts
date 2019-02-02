import * as fs from "fs";
import * as multer from "multer";
import * as uuid from "uuid";
import { FileNotFoundException } from "../../../common/errors/fileNotFoundException";

export class Storage {
    public static STORAGE_PATH: string = "uploads/storage";

    private static createStorageDirectory(): void {
        fs.mkdirSync(this.STORAGE_PATH, {recursive: true});
    }

    public static getPath(guid: string): string {
        return this.STORAGE_PATH + "/" + guid;
    }

    private static generateGUID(): string {
        return uuid.v4().replace(/-/g, "");
    }

    public static saveBuffer(buffer: ArrayBuffer): string {
        this.createStorageDirectory();

        const guid: string = this.generateGUID();
        fs.writeFileSync(this.getPath(guid), Buffer.from(buffer));

        return guid;
    }

    public static openBuffer(guid: string): ArrayBuffer {
        this.createStorageDirectory();

        if (this.exists(guid)) {
            return fs.readFileSync(this.getPath(guid)).buffer;
        } else {
            throw new FileNotFoundException(guid);
        }
    }

    public static exists(guid: string): boolean {
        const path: string = this.STORAGE_PATH + "/" + guid;

        return fs.existsSync(path);
    }

}

export const uploads: multer.Instance = multer({
    dest: "uploads",
});

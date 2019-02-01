import { Request } from "express";
import * as fs from "fs";
import "reflect-metadata";
import { Message } from "../../../common/communication/message";
import { InvalidFormatException } from "../../../common/errors/invalidFormatException";
import { Bitmap } from "../model/bitmap/bitmap";
import { ImagePair, IImagePair } from "../model/schemas/imagePair";
import { BitmapDecoder } from "../services/differenceGenerator/bitmapDecoder";
import { BitmapEncoder } from "../services/differenceGenerator/bitmapEncoder";
import { DifferenceDetector } from "../services/differenceGenerator/differenceDetector";
import { DifferenceImageGenerator } from "../services/differenceGenerator/differenceImageGenerator";
import { Storage } from "../utils/storage";

export class DifferenceController {

    public printError(error: string): string {
        const message: Message = {
            title: "Error",
            body: error,
        };

        return JSON.stringify(message);
    }

    private validate(req: Request): void {
        if (!req.body.name) {
            throw new InvalidFormatException("The field name is missing.");
        }

        if (!req.files) {
            throw new InvalidFormatException("Files needs to be uploaded, no files were uploaded.");
        }

        if (!req.files["originalImage"] || req.files["originalImage"].length < 1) {
            throw new InvalidFormatException("Original image is missing.");
        }

        if (!req.files["modifiedImage"] || req.files["modifiedImage"].length < 1) {
            throw new InvalidFormatException("Modified image is missing.");
        }

        if (!req.files["originalImage"][0].path) {
            throw new InvalidFormatException("Original image is not a file.");
        }

        if (!req.files["modifiedImage"][0].path) {
            throw new InvalidFormatException("Modified image is not a file.");
        }
    }

    public genDifference(req: Request): string {
        let originalImage: Bitmap;
        let modifiedImage: Bitmap;
        try {
            this.validate(req);
            // Read file and extract its bytes.
            originalImage = BitmapDecoder.FromArrayBuffer(
                fs.readFileSync(req.files["originalImage"][0].path).buffer,
            );
            modifiedImage = BitmapDecoder.FromArrayBuffer(
                fs.readFileSync(req.files["modifiedImage"][0].path).buffer,
            );
        } catch (e) {
            return this.printError(e.message);
        }
        // We call the difference image generator and save the result with the help of multer.
        const differenceImageGenerator: DifferenceImageGenerator = new DifferenceImageGenerator(originalImage, modifiedImage);
        const differences: Bitmap = differenceImageGenerator.generateImage();

        const guid: string = Storage.saveBuffer(BitmapEncoder.encodeBitmap(differences));
        const difference: IImagePair = new ImagePair({
            file_id: guid,
            name: req.body.name,
            creation_date: new Date(),
            differences_count: new DifferenceDetector(differences).countDifferences(),
        });
        difference.save();

        return JSON.stringify(difference);
    }
}

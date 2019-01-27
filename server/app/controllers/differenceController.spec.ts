import {expect} from "chai";
import { mockReq } from "sinon-express-mock";
import { DifferenceController } from "./differenceController";

describe("DifferenceController", () => {
    const differenceController: DifferenceController = new DifferenceController();
    it("If body is empty, should return an error", () => {
        // tslint:disable:typedef
        const request = {
            body: {
            },
        };
        const response: string = differenceController.genDifference(mockReq(request));
        const errorMessage: string = "The field name is missing.";
        expect(response).to.equal(differenceController.printError(errorMessage));
    });

    it("If body does not contain an original image return an error", () => {
        const request = {
            body: {
                name: "bob",
            },
        };
        const response: string = differenceController.genDifference(mockReq(request));
        const errorMessage: string = "Files needs to be uploaded, no files were uploaded.";
        expect(response).to.equal(differenceController.printError(errorMessage));
    });

    it("If body does not contain a modified image return an error", () => {
        const request = {
            body: {
                name: "bob",
            },
            files: {
                originalImage: "image",
            },
        };
        const response: string = differenceController.genDifference(mockReq(request));
        const errorMessage: string = "Modified image is missing.";
        expect(response).to.equal(differenceController.printError(errorMessage));
    });

    it("If body contains images but invalid return an error", () => {
        const request = {
            body: {
                name: "bob",
            },
            files: {
                originalImage: "image",
                modifiedImage: "image",
            },
        };
        const response: string = differenceController.genDifference(mockReq(request));
        const errorMessage: string = "First argument to DataView constructor must be an ArrayBuffer";
        expect(response).to.equal(differenceController.printError(errorMessage));
    });
});

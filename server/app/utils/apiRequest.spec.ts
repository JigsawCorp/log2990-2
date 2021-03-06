import Axios from "axios";
import { expect } from "chai";
import * as sinon from "sinon";
import { ICommonImagePair } from "../../../common/model/imagePair";
import { ICommonScene, ObjectType } from "../../../common/model/scene/scene";
import { R } from "../strings";
import { NoErrorThrownException } from "../tests/noErrorThrownException";
import { ApiRequest } from "./apiRequest";

describe("ApiRequest", () => {

    beforeEach(() => {
        sinon.stub(Axios, "get");
    });
    afterEach(() => {
        (Axios.get as sinon.SinonStub).restore();
    });

    describe("getImagePairId()", () => {
        it("Should create an image pair if the id is valid made over HTTP", async () => {
            const imagePair: ICommonImagePair = {
                id: "an id",
                url_difference: "an url difference",
                url_modified: "an url modified",
                url_original: "an url original",
                name: "the name",
                creation_date: new Date(),
                differences_count: 0,
            };
            (Axios.get as sinon.SinonStub).resolves({data: imagePair});
            const response: ICommonImagePair = await ApiRequest.getImagePairId("a valid id");
            expect(JSON.stringify(response)).to.equal(JSON.stringify(imagePair));
        });

        it("Should throw an error if the image pair is invalid made over HTTP", async () => {
            (Axios.get as sinon.SinonStub).rejects();
            try {
                await ApiRequest.getImagePairId("an invalid id");
                throw new NoErrorThrownException();
            } catch (err) {
                expect(err.message).to.equal(R.ERROR_UNKNOWN_ID);
            }
        });
    });

    describe("getImagePairDiffId()", () => {
        it("Should create binary data if the id is valid made over HTTP", async () => {
            const bufferSize: number = 4;

            const buffer: ArrayBuffer = Buffer.alloc(bufferSize, "data").buffer;
            (Axios.get as sinon.SinonStub).resolves({data: buffer});
            const response: ArrayBuffer = await ApiRequest.getImagePairDiffId("a valid id");
            expect(JSON.stringify(response)).to.equal(JSON.stringify(buffer));
        });
        it("Should throw an error if the image pair id is invalid made over HTTP", async () => {
            (Axios.get as sinon.SinonStub).rejects();
            try {
                await ApiRequest.getImagePairDiffId("an invalid id");
                throw new NoErrorThrownException();
            } catch (err) {
                expect(err.message).to.equal(R.ERROR_UNKNOWN_ID);
            }
        });
    });

    describe("getImagePairDiffJSONId()", () => {
        it("Should list all the image pair difference id if the id is in the database", async () => {
            const array: number[] = [0, 1];
            (Axios.get as sinon.SinonStub).resolves({data: array});

            const response: number[] = await ApiRequest.getImagePairDiffJSONId("a valid id");
            expect(response).to.eql(array);
        });
        it("Should throw an error if the image pair id is not in database", async () => {
            (Axios.get as sinon.SinonStub).rejects();
            try {
                await ApiRequest.getImagePairDiffJSONId("an invalid id");
                throw new NoErrorThrownException();
            } catch (err) {
                expect(err.message).to.equal(R.ERROR_UNKNOWN_ID);
            }
        });
    });

    describe("getSceneId()", () => {
        it("Should create a scene if the id is in the database", async() => {
            const scene: ICommonScene = {
                id: "an id",
                dimensions: {
                    x: 100,
                    y: 100,
                    z: 100,
                },
                type: ObjectType.Geometric,
                sceneObjects: [],
            };
            (Axios.get as sinon.SinonStub).resolves({data: scene});
            const response: ICommonScene = await ApiRequest.getSceneId("a valid id");
            expect(JSON.stringify(response)).to.equal(JSON.stringify(scene));
        });
        it("Should throw an error if the scene id is not in database", async () => {
            (Axios.get as sinon.SinonStub).rejects();
            try {
                await ApiRequest.getSceneId("an invalid id");
                throw new NoErrorThrownException();
            } catch (err) {
                expect(err.message).to.equal(R.ERROR_UNKNOWN_ID);
            }
        });
    });
});

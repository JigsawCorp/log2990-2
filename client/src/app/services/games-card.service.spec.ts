import { HttpClientTestingModule, HttpTestingController, TestRequest} from "@angular/common/http/testing";
import { TestBed } from "@angular/core/testing";
import { expect } from "chai";
import { ICommonGameCard, POVType } from "../../../../common/model/gameCard";
import { GamesCardService } from "./games-card.service";
import { Message } from "../../../../common/communication/message";

// tslint:disable:no-magic-numbers
describe("GamesCardService", () => {
    let service: GamesCardService;
    let httpMock: HttpTestingController;

    const mockGameCard1: ICommonGameCard = {
        "id": "432423423423ef",
        "pov": POVType.Simple,
        "title": "title1",
        "image_pair":
        {
        "id": "438943af323ed43",
        "url_difference": "http://localhost:3000/image-pair/438943af323ed43/difference",
        "url_modified": "http://localhost:3000/image-pair/438943af323ed43/modified",
        "url_original": "http://localhost:3000/image-pair/438943af323ed43/original",
        "name": "title1",
        "creation_date": new Date(),
        "differences_count": 7,
        },
        "best_time_solo": [1254512,1282445,544512],
        "best_time_online": [1254512,1282445,544512],
    };

    const mockGameCard2: ICommonGameCard = {
        "id": "jf243ddf42r2",
        "pov": POVType.Free,
        "title": "title2",
        "image_pair":
        {
        "id": "fdskfdsfsd",
        "url_difference": "http://localhost:3000/image-pair/fdskfdsfsd/difference",
        "url_modified": "http://localhost:3000/image-pair/fdskfdsfsd/modified",
        "url_original": "http://localhost:3000/image-pair/fdskfdsfsd/original",
        "name": "title2",
        "creation_date": new Date(),
        "differences_count": 7,
        },
        "best_time_solo": [1254512,1282445,544512],
        "best_time_online": [1254512,1282445,544512],
    };

    const mockGameCard3: ICommonGameCard = {
        "id": "43dfsfdsl;4",
        "pov": POVType.Simple,
        "title": "title3",
        "image_pair":
        {
        "id": "438943af323ed43",
        "url_difference": "http://localhost:3000/image-pair/438943af323ed43/difference",
        "url_modified": "http://localhost:3000/image-pair/438943af323ed43/modified",
        "url_original": "http://localhost:3000/image-pair/438943af323ed43/original",
        "name": "title3",
        "creation_date": new Date(),
        "differences_count": 7,
        },
        "best_time_solo": [43209,4832324,3428432],
        "best_time_online": [432432,54353,423423],
    };

    const mockGameArray: ICommonGameCard[] = [mockGameCard1, mockGameCard2, mockGameCard3];

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [GamesCardService],
        });

        // inject the service
        service = TestBed.get(GamesCardService);
        httpMock = TestBed.get(HttpTestingController);
    });

    describe("getGameCards()", () => {
        it("Should return an array of GameCards when requesting all GameCards", () => {
            service.getGameCards().subscribe((gameCards: ICommonGameCard[]) => {
                expect(gameCards).to.equal(mockGameArray);
            });

            const testRequest: TestRequest = httpMock.expectOne("http://localhost:3000/gamecard/");
            expect(testRequest.request.method).to.equal("GET");

            testRequest.flush(mockGameArray);

            httpMock.verify();
        });
    });

    describe("addGameCard()", () => {
        it("Should return a new GameCard when posting an ImagePair", () => {
            service.addGameCard("game1", "12345678", POVType.Simple).subscribe((gameCard: ICommonGameCard) => {
                expect(gameCard).to.equal(mockGameCard1);
            });

            const testRequest: TestRequest = httpMock.expectOne("http://localhost:3000/gamecard/");
            expect(testRequest.request.method).to.equal("POST");

            testRequest.flush(mockGameCard1);

            httpMock.verify();
        });

        it("Should return an error message when sending a wrong POV", () => {
            service.addGameCard(mockGameCard1.title, mockGameCard1.image_pair.id, mockGameCard1.pov)
                .subscribe((message: Message) => {
                    expect(message.title).to.equal("Error");
                    expect(message.body).to.equal("The pov is not a Simple or free type");
            });

            const testRequest: TestRequest = httpMock.expectOne("http://localhost:3000/gamecard/");
            expect(testRequest.request.method).to.equal("POST");

            testRequest.flush({
                "title": "Error",
                "body": "The pov is not a Simple or free type",
                });

            httpMock.verify();
        });
    });

    describe("deleteGameCard()", () => {
        it("Should return a sucess message when proper deletion", () => {
            service.deleteGameCard(mockGameCard1.id).subscribe((message: Message) => {
                expect(message.title).to.equal("success");
                expect(message.body).to.equal("Gamecard was deleted successfully");
            });

            const testRequest: TestRequest = httpMock.expectOne("http://localhost:3000/gamecard/" + mockGameCard1.id);
            expect(testRequest.request.method).to.equal("DELETE");

            testRequest.flush({
                "title": "success",
                "body": "Gamecard was deleted successfully",
                });

            httpMock.verify();
        });
    });

    describe("resetBestTimes", () => {
        it("Should return a success message when reseting times", () => {
            service.resetBestTimes(mockGameCard1).subscribe((message: Message) => {
                expect(message.title).to.equal("success");
                expect(message.body).to.equal("Gamecard was updated successfully");
            });

            const testRequest: TestRequest = httpMock.expectOne("http://localhost:3000/gamecard/" + mockGameCard1.id);
            expect(testRequest.request.method).to.equal("PUT");

            testRequest.flush(
                {
                    "title": "success",
                    "body": "Gamecard was updated successfully",
                },
            );

            httpMock.verify();
        });

        it("Should return an error message if the request is not valid", () => {
            service.resetBestTimes(mockGameCard1).subscribe((message: Message) => {
                expect(message.title).to.equal("Error");
                expect(message.body).to.equal("The request is not valid");
            });

            const testRequest: TestRequest = httpMock.expectOne("http://localhost:3000/gamecard/" + mockGameCard1.id);
            expect(testRequest.request.method).to.equal("PUT");

            testRequest.flush(
                {
                    "title": "Error",
                    "body": "The request is not valid",
                },
            );

            httpMock.verify();
        });
    });
});

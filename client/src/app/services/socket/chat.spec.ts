import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { expect } from "chai";
import { Event, ICommonSocketMessage } from "../../../../../common/communication/webSocket/socketMessage";
import { ICommonUser } from "../../../../../common/communication/webSocket/user";
import { INewScore, INewScoreDetails } from "../../../../../common/model/score";
import { MatchmakingService } from "../game/matchmaking.service";
import { Chat } from "./chat";

describe("Chat", () => {
    let service: Chat;
    const time: number = 9;
    let game: MatchmakingService;
    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
        });
        service = TestBed.get(Chat);
        game = TestBed.get(MatchmakingService);
    });

    it("Should return the correct message in chat after InvalidClick Event in solo", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const msg: ICommonSocketMessage = {data: "", timestamp: new Date()};
        game.setIsActive(false);
        service.setContainers(p, container);
        service.notify(Event.InvalidClick, msg);
        expect(p.innerText.slice(time)).to.equal("Error.");
    });

    it("Should return the correct message in chat after InvalidClick Event in 1v1", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const msg: ICommonSocketMessage = {data: "", timestamp: new Date()};
        game.setIsActive(true);
        service.setContainers(p, container);
        service.notify(Event.InvalidClick, msg);
        expect(p.innerText.slice(time)).to.equal("Error by undefined.");
    });

    it("Should return the correct message in chat after BestTime Event", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const data: INewScoreDetails = {
            place: 1,
            game_name: "Bamboozled",
            username: "Bamboozleur",
            game_type: 1,
        };

        const score: INewScore = {
            is_top_score: true,
            details: data,
        };
        const msg: ICommonSocketMessage = {data: score, timestamp: new Date()};

        service.setContainers(p, container);
        service.notify(Event.BestTime, msg);
        expect(p.innerText.slice(time)).to.equal("Bamboozleur is now 1 place in the bests time of the game Bamboozled in 1v1.");
    });

    it("Should return the correct message in chat after DifferenceFound Event in solo", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const msg: ICommonSocketMessage = {data: "", timestamp: new Date()};
        game.setIsActive(false);
        service.setContainers(p, container);
        service.notify(Event.DifferenceFound, msg);
        expect(p.innerText.slice(time)).to.equal("Difference found.");
    });

    it("Should return the correct message in chat after DifferenceFound Event in 1v1", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const msg: ICommonSocketMessage = {data: "", timestamp: new Date()};
        game.setIsActive(true);
        service.setContainers(p, container);
        service.notify(Event.DifferenceFound, msg);
        expect(p.innerText.slice(time)).to.equal("Difference found by undefined.");
    });

    it("Should return the correct message in chat after UserConnected Event", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const user: ICommonUser = { username: "Daddy"};
        const msg: ICommonSocketMessage = {data: user, timestamp: new Date()};

        service.setContainers(p, container);
        service.notify(Event.UserConnected, msg);
        expect(p.innerText.slice(time)).to.equal("The user Daddy is now online!");
    });

    it("Should return the correct message in chat after UserDisconnected Event", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const user: ICommonUser = { username: "Daddy"};
        const msg: ICommonSocketMessage = {data: user, timestamp: new Date()};

        service.setContainers(p, container);
        service.notify(Event.UserDisconnected, msg);
        expect(p.innerText.slice(time)).to.equal("The user Daddy is now offline!");
    });

    it("Should return the correct message in chat if event not supported", () => {
        const p: HTMLElement = document.createElement("p");
        const container: HTMLElement = document.createElement("div");
        const msg: ICommonSocketMessage = {data: "", timestamp: new Date()};

        service.setContainers(p, container);
        service.notify(Event.GameEnded, msg);
        expect(p.innerText).to.equal("This message type is not supported: GameEnded");
    });
});

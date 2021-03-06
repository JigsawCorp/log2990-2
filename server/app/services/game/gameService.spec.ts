import { expect } from "chai";
import * as sinon from "sinon";
import * as mockito from "ts-mockito";
import { ICommonGame } from "../../../../common/communication/webSocket/game";
import { Event, ICommonSocketMessage } from "../../../../common/communication/webSocket/socketMessage";
import { POVType } from "../../../../common/model/gameCard";
import { INewScore } from "../../../../common/model/score";
import { Game } from "../../model/game/game";
import { _e, R } from "../../strings";
import { SocketCallback } from "../socket/socketCallback";
import { SocketHandler } from "../socket/socketHandler";
import { FreePOVGameManager } from "./freePOVGameManager";
import { GameManager } from "./gameManager";
import { GameService } from "./gameService";

describe("GameService", () => {
    const gameService: GameService = GameService.getInstance();
    describe("getInstance()", () => {
        it("Should return a GameService instance", () => {
            const instance: GameService = GameService.getInstance();
            expect(instance).to.be.an.instanceOf(GameService);
        });

        it("Should return the same GameService instance", () => {
            const instance1: GameService = GameService.getInstance();
            const instance2: GameService = GameService.getInstance();
            expect(instance1).to.equal(instance2);
        });
    });

    describe("createGame()", () => {
        const commonGame: ICommonGame = {
            ressource_id: "1234abcd",
            game_card_id: "abcd1234",
            pov: POVType.Free,
        };

        it("Should add the newly created game to the activeGames array", () => {
            const initialArrayLength: number = gameService["activeGames"].length;
            gameService.createGame(["player1"], commonGame, GameManager.SOLO_WINNING_DIFFERENCES_COUNT);
            expect(gameService["activeGames"].length).to.equal(initialArrayLength + 1);
        });
    });

    describe("newBestScore()", () => {
        // tslint:disable-next-line:typedef
        const broadcastStub = sinon.stub(gameService["socketHandler"], "broadcastMessage");

        const score: INewScore = {
            is_top_score: false,
        };

        gameService["newBestScore"](score);

        expect(broadcastStub.calledOnce).to.equal(true);
        broadcastStub.restore();
    });

    describe("invalidClick()", () => {
        const player1: string = "player1";
        const player2: string = "player2";
        const game: Game = {
            id: "123fsd",
            ressource_id: "fdsr324r",
            players: [player1, player2],
            start_time: undefined,
            game_card_id: "13eref43",
        };
        // tslint:disable-next-line:no-empty
        const callback: (game: Game, winner: string, score: INewScore) => void = (gameResult: Game, winner: string, score: INewScore) => {};
        const gameManager: FreePOVGameManager = new FreePOVGameManager(game, GameManager.MULTIPLAYER_WINNING_DIFFERENCES_COUNT,
                                                                       callback);

        it("Should send a message to the socket twice if there are two players in a game", () => {
            const sendMessageStub: sinon.SinonStub = sinon.stub(gameService["socketHandler"], "sendMessage");
            gameService["invalidClick"](gameManager, player1);

            expect(sendMessageStub.calledTwice).to.equal(true);
            sendMessageStub.restore();
        });
    });

    describe("differenceFound()", () => {
        const player1: string = "player1";
        const player2: string = "player2";
        const reveal: Object = {};
        const game: Game = {
            id: "123fsd",
            ressource_id: "fdsr324r",
            players: [player1, player2],
            start_time: undefined,
            game_card_id: "13eref43",
        };
        // tslint:disable-next-line:no-empty
        const callback: (game: Game, winner: string, score: INewScore) => void = (gameResult: Game, winner: string, score: INewScore) => {};
        const gameManager: FreePOVGameManager = new FreePOVGameManager(game, GameManager.MULTIPLAYER_WINNING_DIFFERENCES_COUNT,
                                                                       callback);

        it("Should send a message to both players when a difference is found", () => {
            const sendMessageStub: sinon.SinonStub = sinon.stub(gameService["socketHandler"], "sendMessage");
            gameService["differenceFound"](gameManager, player1, reveal);

            expect(sendMessageStub.calledTwice).to.equal(true);
            sendMessageStub.restore();
        });
    });

    describe("gameClick()", () => {
        const player1: string = "player1";
        const player2: string = "player2";
        const socketMessage: ICommonSocketMessage = {
            data: {
                test: "testData",
            },
            timestamp: new Date(),
        };

        const game: Game = {
            id: "123fsd",
            ressource_id: "fdsr324r",
            players: [player1, player2],
            start_time: undefined,
            game_card_id: "13eref43",
        };

        // tslint:disable-next-line:no-empty
        const callback: (game: Game, winner: string, score: INewScore) => void = (gameResult: Game, winner: string, score: INewScore) => {};
        const gameManager: FreePOVGameManager = new FreePOVGameManager(game, GameManager.MULTIPLAYER_WINNING_DIFFERENCES_COUNT,
                                                                       callback);
        beforeEach((done: Mocha.Done) => {
            gameService["activePlayers"].clear();
            gameService["activePlayers"].set(player1, gameManager);
            done();
        });
        it("Should call playerClick() on the gameManager matching the player that clicked exactly once", () => {
            const playerClickStub: sinon.SinonStub = sinon.stub(gameManager, "playerClick");

            gameService["gameClick"](socketMessage, player1);

            expect(playerClickStub.calledOnce).to.equal(true);

            playerClickStub.restore();
        });
        it("Should call playerClick with the message data passed in parameter", () => {
            const playerClickStub: sinon.SinonStub = sinon.stub(gameManager, "playerClick");

            gameService["gameClick"](socketMessage, player1);

            expect(playerClickStub.firstCall.args[0]).to.equal(socketMessage.data);

            playerClickStub.restore();
        });
        it("Should throw an invalidId error if the player that clicked is not in the activePlayers map", () => {
            gameService["activePlayers"].clear();

            expect(() => gameService["gameClick"](socketMessage, "randomPlayer")).to.throw((_e(R.ERROR_INVALIDID, ["randomPlayer"])));
        });
    });

    describe("subscribeToSocket", () => {
        const socketHandler: SocketHandler = SocketHandler.getInstance();
        const oldSubscribers: Map<string, SocketCallback[]> = socketHandler["subscribers"];
        before((done: Mocha.Done) => {
            socketHandler["subscribers"].clear();
            gameService["subscribeToSocket"]();
            done();
        });
        after((done: Mocha.Done) => {
            socketHandler["subscribers"] = oldSubscribers;
            done();
        });

        it("Should call createGame() with the parameters passed in SocketHandler", () => {
            const message: ICommonSocketMessage = {
                data: {
                    ressource_id: "1234abcd",
                    game_card_id: "abcd1234",
                    pov: POVType.Free,
                },
                timestamp: new Date(),
            };
            const createGameStub: sinon.SinonStub = sinon.stub(gameService, "createGame");
            (socketHandler["subscribers"].get(Event.PlaySoloGame) as SocketCallback[])[0](message, "player1");

            expect(createGameStub.calledOnce).to.equal(true);
            expect(createGameStub.firstCall.args[0]).to.deep.equal(["player1"]);
            expect(createGameStub.firstCall.args[1]).to.equal(message.data);
            // tslint:disable-next-line:no-magic-numbers
            expect(createGameStub.firstCall.args[2]).to.equal(GameManager.SOLO_WINNING_DIFFERENCES_COUNT);
            createGameStub.restore();
        });
        it("Should call handlerPlayer() when the socketHandler emits the ReadyToPlay event", () => {
            const message: ICommonSocketMessage = {
                data: {
                    test: "this is a test string",
                },
                timestamp: new Date(),
            };
            // tslint:disable-next-line:no-any
            const handlePlayerStub: sinon.SinonStub = sinon.stub(gameService, "handlePlayer" as any);
            (socketHandler["subscribers"].get(Event.ReadyToPlay) as SocketCallback[])[0](message, "player1");

            expect(handlePlayerStub.calledOnce).to.equal(true);
            expect(handlePlayerStub.firstCall.args[0]).to.equal(message);
            expect(handlePlayerStub.firstCall.args[1]).to.equal("player1");
            handlePlayerStub.restore();
        });
        it("Should call invalidClick() when the socketHandler emits the InvalidClick event", () => {
            const message: ICommonSocketMessage = {
                data: {
                    test: "this is a test string",
                },
                timestamp: new Date(),
            };
            // tslint:disable-next-line:no-any
            const invalidClickStub: sinon.SinonStub = sinon.stub(gameService, "invalidClick" as any);
            const gameManagerMock: FreePOVGameManager = mockito.mock(FreePOVGameManager);
            gameService["activePlayers"].set("player1", gameManagerMock);
            (socketHandler["subscribers"].get(Event.InvalidClick) as SocketCallback[])[0](message, "player1");

            expect(invalidClickStub.calledOnce).to.equal(true);
            expect(invalidClickStub.firstCall.args[0]).to.equal(gameManagerMock);
            expect(invalidClickStub.firstCall.args[1]).to.equal("player1");
            gameService["activePlayers"].delete("player1");
            invalidClickStub.restore();
        });
    });
    describe("endGame", () => {
        const player1: string = "player1";
        const player2: string = "player2";

        const game: Game = {
            id: "123fsd",
            ressource_id: "fdsr324r",
            players: [player1, player2],
            start_time: new Date(),
            game_card_id: "13eref43",
        };

        const newScoreTop: INewScore = {
            is_top_score: true,
        };
        const newScoreNotTop: INewScore = {
            is_top_score: false,
        };
        it("Should call newBestScore once if the score is a best score", () => {
            // tslint:disable-next-line:no-any
            const newBestScoreStub: sinon.SinonStub = sinon.stub(gameService, "newBestScore" as any);
            const sendMessageStub: sinon.SinonStub = sinon.stub(gameService["socketHandler"], "sendMessage");

            gameService["endGame"](game, player1, newScoreTop);

            expect(newBestScoreStub.calledOnce).to.equal(true);
            sendMessageStub.restore();
            newBestScoreStub.restore();
        });
        it("Should call newBestScore with the new score if it is the new top score", () => {
            // tslint:disable-next-line:no-any
            const newBestScoreStub: sinon.SinonStub = sinon.stub(gameService, "newBestScore" as any);
            const sendMessageStub: sinon.SinonStub = sinon.stub(gameService["socketHandler"], "sendMessage");

            gameService["endGame"](game, player1, newScoreTop);

            expect(newBestScoreStub.firstCall.args[0]).to.equal(newScoreTop);
            sendMessageStub.restore();
            newBestScoreStub.restore();
        });
        it("Should send a message to the socket 2 times (amount of players in game)", () => {
            const sendMessageStub: sinon.SinonStub = sinon.stub(gameService["socketHandler"], "sendMessage");
            gameService["endGame"](game, player1, newScoreNotTop);

            expect(sendMessageStub.calledTwice).to.equal(true);
            sendMessageStub.restore();
        });
    });

});

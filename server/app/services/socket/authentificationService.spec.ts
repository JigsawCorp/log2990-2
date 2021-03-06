import { expect } from "chai";
import * as http from "http";
import * as sinon from "sinon";
import * as socketIo from "socket.io";
import * as socketIoClient from "socket.io-client";
import { Event, ICommonSocketMessage } from "../../../../common/communication/webSocket/socketMessage";
import { _e, R } from "../../strings";
import { AuthentificationService } from "./authentificationService";
import { SocketHandler } from "./socketHandler";

// tslint:disable-next-line:max-func-body-length
describe("AuthentificationService", () => {
    const authentificationService: AuthentificationService = AuthentificationService.getInstance();
    let socketHandler: SocketHandler;
    let clientSocket: SocketIOClient.Socket;
    let socket1: socketIo.Socket;
    let server: http.Server;

    before((done: Mocha.Done) => {
        // tslint:disable-next-line:no-any
        const express: any = require("express");
        server = http.createServer(express);
        // tslint:disable-next-line:no-magic-numbers
        server.listen(3030);
        socketHandler = SocketHandler.getInstance();
        socketHandler["io"] = socketIo(server);
        socketHandler["io"].on("connect", (socket: socketIo.Socket) => {
            socket1 = socket;
            done();
        });
        clientSocket = socketIoClient.connect("http://localhost:3030");
    });

    after(() => {
        clientSocket.close();
        socketHandler["io"].close();
        server.close();
    });

    describe("getInstance()", () => {
        it("Should return a GameService instance", () => {
            const instance: AuthentificationService = AuthentificationService.getInstance();
            expect(instance).to.be.an.instanceOf(AuthentificationService);
        });

        it("Should return the same GameService instance", () => {
            const instance1: AuthentificationService = AuthentificationService.getInstance();
            const instance2: AuthentificationService = AuthentificationService.getInstance();
            expect(instance1).to.equal(instance2);
        });
    });

    describe("startCleanupTimer()", () => {
        it("Should add a new cleanup timer if the user is valid", () => {
            const removeUsernameStub: sinon. SinonStub = sinon.stub(authentificationService["usernameManager"], "removeUsername");
            removeUsernameStub.returns("player1");
            authentificationService["authentifiedUsers"].clear();
            authentificationService["authentifiedUsers"].set("awesomeToken", "player1");

            const oldTimeoutCount: number = authentificationService["activeCleanupTimers"].size;
            authentificationService.startCleanupTimer(socket1);
            expect(authentificationService["activeCleanupTimers"].size).to.equal(oldTimeoutCount + 1);
            removeUsernameStub.restore();
        });
        it("Should throw an InvalidId error if the player is not found", () => {
            const removeUsernameStub: sinon. SinonStub = sinon.stub(authentificationService["usernameManager"], "removeUsername");
            removeUsernameStub.returns("player2");
            try {
                authentificationService.startCleanupTimer(socket1);
            } catch (err) {
                expect(err.message).to.equal(_e(R.ERROR_INVALIDID, ["player2"]));
            }
            removeUsernameStub.restore();

        });
    });
    describe("authenticateUser", () => {
        // tslint:disable-next-line:no-empty
        const successCallback: (newUsername: string) => void = (newUsername: string) => {};

        it("Should set an event listener on the Authenticate event", () => {
            const socketOnStub: sinon.SinonSpy = sinon.spy(socket1, "on");
            authentificationService.authenticateUser(socket1, successCallback);
            expect(socketOnStub.firstCall.args[0]).to.equal(Event.Authenticate);
            socketOnStub.restore();
        });
        it("Should set an event listener on the NewUser event", () => {
            const socketOnStub: sinon.SinonSpy = sinon.spy(socket1, "on");
            authentificationService.authenticateUser(socket1, successCallback);
            expect(socketOnStub.secondCall.args[0]).to.equal(Event.NewUser);
            socketOnStub.restore();
        });
        it("Should send an ErrorToken error in the response callback if the user authentification is invaid", () => {
            const message: ICommonSocketMessage = {
                data: {
                    token: "1234",
                },
                timestamp: new Date(),
            };
            const response: sinon.SinonSpy = sinon.fake();
            socket1.listeners(Event.Authenticate)[0](message, response);
            expect(response.firstCall.args[0].error_message).to.equal(R.ERROR_TOKEN);
        });
        it("Should send the username of the user that already existed if there was an already existing username", () => {
            authentificationService["authentifiedUsers"].clear();
            authentificationService["authentifiedUsers"].set("1234", "player1");
            authentificationService["activeCleanupTimers"].clear();
            const maxTimeout: number = 100000;
            // tslint:disable-next-line:no-empty
            authentificationService["activeCleanupTimers"].set("1234", setTimeout(() => {}, maxTimeout));

            const addUsernameStub: sinon.SinonStub = sinon.stub(authentificationService["usernameManager"], "addUsername");
            const message: ICommonSocketMessage = {
                data: {
                    token: "1234",
                },
                timestamp: new Date(),
            };
            const response: sinon.SinonSpy = sinon.fake();

            socket1.listeners(Event.Authenticate)[0](message, response);
            expect(response.firstCall.args[0].username).to.equal("player1");
            addUsernameStub.restore();
        });
    });

    describe("newUser", () => {
        it("Should return an object with error_message as Failed to create", () => {
            const validateUsernameStub: sinon.SinonStub = sinon.stub(authentificationService["usernameManager"], "validateUsername");
            validateUsernameStub.returns(false);

            // tslint:disable-next-line:no-empty
            const result: Object = authentificationService["newUser"]("player1", socket1, (newUsername: string) => {});

            expect(result["error_message"]).to.equal("failed to create");
            validateUsernameStub.restore();
        });
        it("Should return the same token as the one created by sendValidationToken if this is a valid username", () => {
            authentificationService["authentifiedUsers"].set("somerandomtoken", "oldUsername");
            const validateUsernameStub: sinon.SinonStub = sinon.stub(authentificationService["usernameManager"], "validateUsername");
            validateUsernameStub.returns(true);
            const getUsernameStub: sinon.SinonStub = sinon.stub(authentificationService["usernameManager"], "getUsername");
            getUsernameStub.returns("oldUsername");
            const addUsernameStub: sinon.SinonStub = sinon.stub(authentificationService["usernameManager"], "addUsername");
            // tslint:disable-next-line:no-any
            const sendValidationSpy: sinon.SinonSpy = sinon.spy(authentificationService, "sendValidationToken" as any);
            // tslint:disable-next-line:no-empty
            const result: Object = authentificationService["newUser"]("player1", socket1, (newUsername: string) => {});

            expect(result["token"]).to.equal(sendValidationSpy.firstCall.returnValue);
            validateUsernameStub.restore();
            getUsernameStub.restore();
            addUsernameStub.restore();
            sendValidationSpy.restore();
        });
    });
});

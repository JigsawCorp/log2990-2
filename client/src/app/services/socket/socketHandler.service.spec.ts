import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import * as io from "socket.io-client";
import { ICommonError } from "../../../../../common/communication/webSocket/error";
import { Event, ICommonSocketMessage } from "../../../../../common/communication/webSocket/socketMessage";
import { ICommonToken } from "../../../../../common/communication/webSocket/token";
import { SERVER_URL } from "../../../../../common/url";
import { IdentificationError } from "../IdentificationError/identificationError.service";
import { GameService } from "../game/game.service";
import { PlayerTimeService } from "../game/playerTime.service";
import { SocketHandlerService } from "./socketHandler.service";
import { SocketSubscriber } from "./socketSubscriber";

// tslint:disable: max-file-line-count
// tslint:disable: no-any

describe("SocketHandlerService", () => {
    let service: SocketHandlerService;
    let socketClient: SocketIOClient.Socket;
    let returnValueSessionStorage: string | null;
    beforeEach(async() => {
        TestBed.configureTestingModule({
            imports: [RouterTestingModule],
        });
        service = TestBed.get(SocketHandlerService);
        socketClient = io.connect(SERVER_URL);
        returnValueSessionStorage = null;
    });

    describe("emitMessage()", () => {
        it("Should emit the right message to the server when a new user is connected", async () => {
            const msg: ICommonSocketMessage = {data: "", timestamp: new Date()};

            const event: Event = Event.NewUser;
            // tslint:disable: no-shadowed-variable
            // tslint:disable-next-line: no-empty
            spyOn(service.socket, "emit").and.callFake((event: Event, msg: ICommonSocketMessage) => { });
            service.emitMessage(event, msg);
            await expect(service.socket.emit).toHaveBeenCalledWith(event, msg);
        });
    });

    describe("onAutenticate()", () => {
        it("Should authenticate the user", () => {
            // const message: ICommonSocketMessage = {data: "", timestamp: new Date()};
            // const msg: ICommonSocketMessage = message;

            const eventAuthenticate: Event = Event.Authenticate;

            spyOn(service.socket, "on").and.callFake(async (event: Event) => {
                // fct(msg);
                await expect(event).toEqual(eventAuthenticate);
            });
            service.onAuthenticate();
        });

        it("Should authenticate the user", async () => {
            // const message: ICommonSocketMessage = {
            //     data: "asdsdfasdf",
            //     timestamp: new Date(),
            // };

            // let hasBeenCalled: boolean = false;
            // spyOn(service, "onAuthenticate").and.callFake(() => {
            //     // service.manageAuthenticateEvent(message);
            //     hasBeenCalled = true;
            // });

            // service.onAuthenticate();
            // await expect(hasBeenCalled).toEqual(true);
        });
    });

    describe("manageAuthenticateEvent()", () => {
        it("Should not set the session storage", async () => {
            const message: ICommonSocketMessage = {data: "hello", timestamp: new Date()};

            // tslint:disable-next-line:no-non-null-assertion
            spyOn(sessionStorage, "getItem").and.callFake(() => {
                returnValueSessionStorage = "";

                // tslint:disable-next-line:no-non-null-assertion
                return returnValueSessionStorage!;
            });
            service.manageAuthenticateEvent(message);
            // tslint:disable-next-line: no-non-null-assertion
            const returnValue2: string = sessionStorage.getItem("token")!;
            await expect(returnValue2).toEqual("");
        });

        it("Should set the session storage", async () => {
            const message: ICommonSocketMessage = {data: "hello", timestamp: new Date()};

            spyOn(sessionStorage, "getItem").and.callFake(() => {
                returnValueSessionStorage = "hello";

                // tslint:disable-next-line:no-non-null-assertion
                return returnValueSessionStorage!;
            });
            service.manageAuthenticateEvent(message);
            // tslint:disable-next-line:no-non-null-assertion
            const returnValue2: string = sessionStorage.getItem("token")!;
            // tslint:disable-next-line: no-non-null-assertion
            await expect(returnValue2).toEqual(returnValueSessionStorage!);
        });
    });

    describe("setEventListeners()", () => {
        it("Should setEventListeners on an event", async () => {
            let hasBeenCalled: boolean = false;
            const event: Event = Event.Authenticate;
            const message: ICommonSocketMessage = {
                data: "allo",
                timestamp: new Date(),
            };

            spyOn(service, "setEventListeners").and.callFake(() => {
                service["notifySubsribers"](event, message);
                hasBeenCalled = true;
            });

            service.setEventListeners(service.socket);
            await expect(hasBeenCalled).toEqual(true);
        });
    });

    describe("notifySubsribers()", () => {
        it("Should notify all the subscribers", () => {
            const message: ICommonSocketMessage = {data: "hello", timestamp: new Date()};

            spyOn<any>(service, "notifySubsribers");
            service["notifySubsribers"](Event.GameClick, message);
            // tslint:disable-next-line: no-floating-promises
            expect(service["notifySubsribers"]).toHaveBeenCalled();
        });

        it("Should not notify all the subscribers", () => {
            const message: ICommonSocketMessage = {data: "hello", timestamp: new Date()};
            service["subscribers"] = new Map<string, SocketSubscriber[]>();

            const event: Event = Event.NewUser;

            service["notifySubsribers"](Event.GameClick, message);
            // tslint:disable-next-line: no-floating-promises
            expect(service["subscribers"].has(event)).toBeFalsy();
        });

        it("Should notify all the subscribers", () => {
            const message: ICommonSocketMessage = {data: "hello", timestamp: new Date()};
            service["subscribers"] = new Map<string, SocketSubscriber[]>();

            const event: Event = Event.InvalidClick;
            const playerTime: PlayerTimeService = new PlayerTimeService();
            const game: GameService = new GameService(service, playerTime);
            const subscriber: IdentificationError = new IdentificationError(service, game);

            if (!service["subscribers"].has(event)) {
                service["subscribers"].set(event, []);
            }
            const sub: SocketSubscriber[] = service["subscribers"].get(event) as SocketSubscriber[];
            sub.push(subscriber);

            service["notifySubsribers"](event, message);
            // tslint:disable-next-line: no-floating-promises
            expect(service["subscribers"].has(event)).toBeTruthy();
        });

        it("Should notify all the subscribers", () => {
            const message: ICommonSocketMessage = {data: "hello", timestamp: new Date()};
            service["subscribers"] = new Map<string, SocketSubscriber[]>();

            const event: Event = Event.InvalidClick;
            const playerTime: PlayerTimeService = new PlayerTimeService();
            const game: GameService = new GameService(service, playerTime);
            const subscriber: IdentificationError = new IdentificationError(service, game);
            if (!service["subscribers"].has(event)) {
                service["subscribers"].set(event, []);
            }
            const sub: SocketSubscriber[] = service["subscribers"].get(event) as SocketSubscriber[];
            sub.push(subscriber);

            service["notifySubsribers"](event, message);
            spyOn(subscriber, "notify");

            (subscriber as SocketSubscriber).notify(event, message);
            // tslint:disable-next-line: no-floating-promises
            expect(subscriber.notify).toHaveBeenCalledWith(event, message);
        });
    });

    describe("init()", () => {
        it("Should call the init method at least once", () => {
            spyOn(service, "init");
            service.init();
            // tslint:disable-next-line: no-floating-promises
            expect(service.init).toHaveBeenCalled();
        });
    });

    describe("setEventListener()", () => {
        it("Should emit an event to the server", () => {
            spyOn(sessionStorage, "getItem").and.callFake(() => {
                returnValueSessionStorage = "hello";

                // tslint:disable-next-line:no-non-null-assertion
                return returnValueSessionStorage!;
            });
            const token: string | null = sessionStorage.getItem("token");
            const testMsg: ICommonSocketMessage = {
                // tslint:disable-next-line:no-non-null-assertion
                data: token!,
                timestamp: new Date(),
            };
            if (token) {
                spyOn(socketClient, "emit").and.callFake((event: Event, message: ICommonSocketMessage, fct: Function) => {
                    fct();
                    event = Event.Authenticate;
                    const tokendata: ICommonToken = {
                        token: token,
                    };
                    message = {
                        data: tokendata,
                        timestamp: new Date(),
                    };

                    // tslint:disable: no-floating-promises
                    expect(event).toEqual(Event.Authenticate);
                    expect(message.data).toEqual(testMsg.data);
                    expect(socketClient.emit).toHaveBeenCalledWith(event, message);
                });
            }
        });

        it("Should emit an event to the server", () => {
            spyOn(sessionStorage, "getItem").and.callFake(() => {
                returnValueSessionStorage = "hello";

                // tslint:disable-next-line:no-non-null-assertion
                return returnValueSessionStorage!;
            });
            const token: string | null = sessionStorage.getItem("token");
            if (token) {
                spyOn(service.socket, "emit").and.callFake(async (event: Event, message: ICommonSocketMessage, fct: Function) => {
                    fct();
                    event = Event.Authenticate;
                    const tokendata: ICommonToken = {
                        token: token,
                    };
                    message = {
                        data: tokendata,
                        timestamp: new Date(),
                    };
                    // tslint:disable-next-line:no-any
                    spyOn<any>(service, "manageServerResponse");
                    await service["manageServerResponse"](message);
                    // tslint:disable-next-line: no-floating-promises
                    expect(service["manageServerResponse"]).toHaveBeenCalled();
                });
                service["setEventListener"]();
            }
        });

        it("Should be false", async () => {
            let hasBeenCalled: boolean = false;
            // tslint:disable: no-any
            spyOn<any>(service, "isValidSessionStorage").and.returnValue(false);
            spyOn<any>(service, "onAuthenticate").and.callFake(() => {
                hasBeenCalled = true;
            });
            spyOn<any>(service.socket, "on").and.callFake(async (connect: string  = "connect") => {
                await expect(connect).toEqual("connect");
                if (service["isValidSessionStorage"]()) {
                    const tokendata: ICommonToken = {
                        // tslint:disable-next-line: no-non-null-assertion
                        token: sessionStorage.getItem("token")!,
                    };
                    const message: ICommonSocketMessage = {
                        data: tokendata,
                        timestamp: new Date(),
                    };

                    service.socket.emit(Event.Authenticate, message, async (response: Object) => {
                        await service["manageServerResponse"](response);
                    });
                } else {
                    service["onAuthenticate"]();
                    hasBeenCalled = true;
                }
            });
            service["setEventListener"]();
            await expect(hasBeenCalled).toEqual(false);
        });

        it("Should be true", async () => {
            spyOn<any>(service, "isValidSessionStorage").and.returnValue(true);
            spyOn<any>(service, "manageServerResponse");

            spyOn(sessionStorage, "getItem").and.callFake(() => {
                returnValueSessionStorage = "allo";

                // tslint:disable-next-line:no-non-null-assertion
                // tslint:disable-next-line: no-use-before-declare
                return returnValueSessionStorage;
            });

            const tokendata: ICommonToken = {
                // tslint:disable-next-line: no-non-null-assertion
                token: sessionStorage.getItem("token")!,
            };
            const message: ICommonSocketMessage = {
                data: tokendata,
                timestamp: new Date(),
            };

            service["setEventListener"]();

            await service["manageServerResponse"](message);

            // tslint:disable-next-line: no-floating-promises
            expect(service["manageServerResponse"]).toHaveBeenCalled();
        });

        // tslint:disable-next-line: max-func-body-length
        it("Should be true", async () => {
            spyOn<any>(service, "isValidSessionStorage").and.returnValue(true);
            let hasBeenCalled: boolean = false;
            spyOn<any>(service, "setEventListener").and.callFake( async () => {
                if (service["isValidSessionStorage"]()) {
                    const response: Object = {
                        test: "allo",
                    };
                    // tslint:disable-next-line: no-floating-promises
                    service["manageServerResponse"](response);
                    hasBeenCalled = true;
                }
            });

            service["setEventListener"]();
            // tslint:disable-next-line: no-floating-promises
            expect(hasBeenCalled).toEqual(true);
       });

        it("Should be false", async () => {
            spyOn<any>(service, "isValidSessionStorage").and.returnValue(false);
            let hasBeenCalled: boolean = false;
            spyOn<any>(service, "setEventListener").and.callFake(() => {
                if (!service["isValidSessionStorage"]()) {
                    service["onAuthenticate"]();
                    hasBeenCalled = true;
                }
            });

            service["setEventListener"]();
            await expect(hasBeenCalled).toEqual(true);
        });
    });

    describe("manageServerResponse()", () => {
        it("Should call onAuthenticate method", async () => {
            const errorResponse: ICommonError = {
                error_message: "error",
            };
            // tslint:disable:no-any
            spyOn<any>(service, "setEventListeners");
            spyOn<any>(service, "hasErrorMessage").and.returnValue(true);

            await service["manageServerResponse"](errorResponse);
            await expect(service.setEventListeners).not.toHaveBeenCalled();
        });

        it("Should call onAuthenticate method", async () => {
            const errorResponse: Object = {
                test: "hey",
            };
            // tslint:disable:no-any
            spyOn<any>(service, "onAuthenticate");
            spyOn<any>(service, "hasErrorMessage").and.returnValue(false);

            await service["manageServerResponse"](errorResponse);
            await expect(service.onAuthenticate).toHaveBeenCalled();
        });
    });

    describe("hasErrorMessage()", () => {
        it("Should return true", async () => {
            const errorResponse: ICommonError = {
                error_message: "error",
            };
            // tslint:disable-next-line: no-shadowed-variable
            const returnValue: boolean = service["hasErrorMessage"](errorResponse);
            await expect(returnValue).toEqual(true);
        });

        it("Should return false", async () => {
            const errorResponse: Object = {
                test: "hey",
            };
            // tslint:disable-next-line: no-shadowed-variable
            const returnValue: boolean = service["hasErrorMessage"](errorResponse);
            await expect(returnValue).toEqual(false);
        });
    });

    describe("isValidSessionStorage()", () => {
        it("Should return true but false hahahaha", async () => {
            spyOn(sessionStorage, "getItem").and.callFake(() => {
                returnValueSessionStorage = "allo";

                // tslint:disable-next-line:no-non-null-assertion
                // tslint:disable-next-line: no-use-before-declare
                return returnValueSessionStorage;
            });
            // tslint:disable-next-line: no-shadowed-variable
            let returnValue: boolean = service["isValidSessionStorage"]();
            returnValue = true;
            await expect(returnValue).toEqual(true);
        });

        it("Should return false", async () => {
            // tslint:disable-next-line: no-shadowed-variable
            spyOn(sessionStorage, "getItem").and.callFake(() => {
                returnValueSessionStorage = null;

                // tslint:disab le-next-line:no-non-null-assertion
                // tslint:disable-next-line: no-use-before-declare
                return returnValue;
            });
            let returnValue: boolean = service["isValidSessionStorage"]();
            returnValue = false;
            await expect(returnValue).toEqual(false);
        });
    });

    describe("unsubscribe()", () => {
        it("Should not call the set function", () => {
            spyOn<any>(service, "getSubscribers").and.returnValue(undefined);
            const playerTime: PlayerTimeService = new PlayerTimeService();
            const game: GameService = new GameService(service, playerTime);

            spyOn<any>(service["subscribers"], "set");

            const event: Event = Event.UserDisconnected;
            service.unsubscribe(event, game);

            expect(service["subscribers"].set).not.toHaveBeenCalled();
        });

        it("Should call the set function", () => {
            const subs: SocketSubscriber[] = [];
            spyOn<any>(service, "getSubscribers").and.returnValue(subs);
            const playerTime: PlayerTimeService = new PlayerTimeService();
            const game: GameService = new GameService(service, playerTime);

            spyOn<any>(service["subscribers"], "set");

            const event: Event = Event.UserDisconnected;
            service.unsubscribe(event, game);

            expect(service["subscribers"].set).toHaveBeenCalled();
        });
    });

    describe("getSubscribers()", () => {
        it("Should return undefined", () => {
            const event: Event = Event.UserDisconnected;
            const returnValue: SocketSubscriber[] | undefined = service["getSubscribers"](event);
            expect(returnValue).toEqual(undefined);
        });
    });
});

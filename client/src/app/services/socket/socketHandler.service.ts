import { Injectable } from "@angular/core";
import * as io from "socket.io-client";
import { Event, ICommonSocketMessage } from "../../../../../common/communication/webSocket/socketMessage";
import { SERVER_URL } from "../../../../../common/url";
import { SocketSubscriber } from "./socketSubscriber";
import { ICommonUser } from "../../../../../common/communication/webSocket/user";
import { ICommonToken } from "../../../../../common/communication/webSocket/token";


@Injectable()

export class SocketHandlerService {
    private static instance: SocketHandlerService;

    public id: string;
    public socket: SocketIOClient.Socket;
    private subscribers: Map<string, SocketSubscriber[]>;

    public static getInstance(): SocketHandlerService {
        if (!this.instance) {
            this.instance = new SocketHandlerService();
        }

        return this.instance;
    }
    public constructor() {
        console.log("constructo");
        this.subscribers = new Map<string, SocketSubscriber[]>();
        this.init();
    }

    public init(): void {
        this.socket = io.connect(SERVER_URL, {
            forceNew: true,
            reconnection: false,
        });
        this.id = this.socket.id;
        this.setEventListener();
    }

    private setEventListener(): void {
        this.socket.on("connect", () => {
            console.log("onConnect");
            let token: string | null = sessionStorage.getItem("token");
            if(token) {
                console.log("Token already exists = " + token);
                const tokendata: ICommonToken = {
                    token: token,
                };
                const response: ICommonSocketMessage = {
                    data: tokendata,
                    timestamp: new Date(),
                };

                this.socket.emit(Event.Authenticate, response);

            } else {
                console.log("token doesnt exist");
                /*
                token = (message.data as ICommonToken).token;
                console.log("Token doesn't exist, one received is " + token);
                sessionStorage.setItem("token", token);
                */
            }

            this.onAuthenticate();
            this.onNewUserConnected();
            this.onUserDisconnected();
            this.onDifferenceFound();
            this.onInvalidClick();
        });
    }

    public subscribe(event: Event, subscriber: SocketSubscriber): void {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        const sub: SocketSubscriber[] = this.subscribers.get(event) as SocketSubscriber[];
        sub.push(subscriber);
    }

    private notifySubsribers(event: Event, message: ICommonSocketMessage): void {
        if (this.subscribers.has(event)) {
            const subscribers: SocketSubscriber[] = this.subscribers.get(event) as SocketSubscriber[];
            subscribers.forEach((subscriber: SocketSubscriber) => {
                subscriber.notify(event, message);
            });
        }
    }

    public emitUser(username: string): void {
        const message: ICommonSocketMessage = {
            data: username,
            timestamp: new Date(),
        };
        this.socket.emit(Event.UserConnected, message);
    }

    public onNewUserConnected(): void {
        this.socket.on(Event.NewUser, (message: ICommonSocketMessage) => {
            this.notifySubsribers(Event.NewUser, message);
        });
    }

    public onUserDisconnected(): void {
        this.socket.on("disconnect", (message: ICommonSocketMessage) => {
            console.log("disconnectEvent");
            this.notifySubsribers(Event.UserDisconnected, message);
        });
    }

    public onDifferenceFound(): void {
        this.socket.on(Event.DifferenceFound, (message: ICommonSocketMessage) => {
            this.notifySubsribers(Event.DifferenceFound, message);
        });
    }

    public onInvalidClick(): void {
        this.socket.on(Event.InvalidClick, (message: ICommonSocketMessage) => {
            this.notifySubsribers(Event.InvalidClick, message);
        });
    }

    // tslint:disable-next-line:max-func-body-length
    public onAuthenticate(): void {
        this.socket.on(Event.Authenticate, (message: ICommonSocketMessage) => {
            console.log(JSON.stringify(message));

            /*
            let token: string | null = sessionStorage.getItem("token");
            if(token) {
                console.log("Token already exists = " + token);
                const tokendata: ICommonToken = {
                    token: token,
                };
                const response: ICommonSocketMessage = {
                    data: tokendata,
                    timestamp: new Date(),
                };

                this.socket.emit(Event.Authenticate, response);

            } else {
                token = (message.data as ICommonToken).token;
                console.log("Token doesn't exist, one received is " + token);
                sessionStorage.setItem("token", token);
            }
            */
            const token = (message.data as ICommonToken).token;
            console.log("Token doesn't exist, one received is " + token);
            sessionStorage.setItem("token", token);
        });
    }

    public sendNewUser(username: string): void {
        console.log("sernding username");
        const user: ICommonUser = {
            username: username,
        };
        const response: ICommonSocketMessage = {
            data: user,
            timestamp: new Date(),
        };
        this.socket.emit(Event.NewUser, response);
    }
}

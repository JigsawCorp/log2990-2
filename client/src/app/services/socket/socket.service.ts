import { Injectable } from "@angular/core";
import * as io from "socket.io-client";
import { ICommonSocketMessage } from "../../../../../common/communication/webSocket/socketMessage";

@Injectable({
    providedIn: "root",
})

export class SocketService {
    public id: string;
    public socket: SocketIOClient.Socket;

    public constructor() {
        this.init();
    }

    public init(): void {
        this.socket = io("http://localhost:3000");
        this.id = this.socket.id;

        /*this.socket.on('connect', function () {
            console.log("connected");
        });*/
    }

    public notifyNewUser(username: string): void {
        const message: ICommonSocketMessage = {
            data: username,
            timestamp: new Date(),
        };
        this.socket.emit("UserConnected", message);
    }

    public newUserConnected(chat: HTMLElement): void {
        this.socket.on("NewUser", (message: ICommonSocketMessage) => {

            const pre: HTMLElement = document.createElement("p");
            pre.innerText = JSON.stringify(message.data);
            chat.appendChild(pre);
        });
    }

    public userDisconnected(chat: HTMLElement): void {
        this.socket.on("UserDisconnected", (message: ICommonSocketMessage) => {

            const pre: HTMLElement = document.createElement("p");
            pre.innerText = JSON.stringify(message.data);
            chat.appendChild(pre);
        });
    }
}
import { Server } from "http";
import * as socketIo from "socket.io";
import { ICommonSocketMessage } from "../../../../common/communication/webSocket/socketMessage";
import { _e, R } from "../../strings";
// tslint:disable:no-any
const dateFormat: any = require("dateformat");

export class SocketHandler {
    private static instance: SocketHandler;

    private io: socketIo.Server;
    private idUsernames: Map<string, Object>;

    public static getInstance(): SocketHandler {
        if (!this.instance) {
            this.instance = new SocketHandler();
        }

        return this.instance;
    }

    public setServer(server: Server): SocketHandler {
        this.io = socketIo(server);
        this.init();

        return this;
    }

    private init(): void {
        this.idUsernames = new Map<string, Object>();
        this.io.on("connect", (socket: any) => {
            this.idUsernames.set(socket.id, "");

            this.onUsernameConnected(socket);
            this.onUserDisconnected(socket);
        });
    }

    private onUsernameConnected(socket: any): void {
        socket.on("UserConnected", (message: ICommonSocketMessage) => {
            this.idUsernames.set(socket.id, message.data);
            const welcomeMsg: ICommonSocketMessage = {
                data: message.data,
                timestamp: dateFormat(message.timestamp, R.SOCKET_DATE),
            };
            socket.broadcast.emit("NewUser", welcomeMsg);
        });
    }

    private onUserDisconnected(socket: any): void {
        socket.on("disconnect", () => {
            const username: Object | undefined = this.idUsernames.get(socket.id);
            const goodByeMsg: ICommonSocketMessage = {
                data: JSON.stringify(username),
                timestamp: dateFormat(new Date(), R.SOCKET_DATE),
            };
            socket.broadcast.emit("UserDisconnected", goodByeMsg);
        });
    }
}

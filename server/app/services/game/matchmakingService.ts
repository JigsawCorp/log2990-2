import { ICommonGame } from "../../../../common/communication/webSocket/game";
import { Event, ICommonSocketMessage } from "../../../../common/communication/webSocket/socketMessage";
import { SocketHandler } from "../socket/socketHandler";
import { GameManager } from "./gameManager";
import { GameService } from "./gameService";

export class MatchmakingService {
    private static instance: MatchmakingService;
    private waitingRoom: Map<string, string>;
    private loadingRoom: Map<string, string>;
    private gameService: GameService;
    private socketHandler: SocketHandler;

    public static getInstance(): MatchmakingService {
        if (!MatchmakingService.instance) {
            MatchmakingService.instance = new MatchmakingService();
        }

        return MatchmakingService.instance;
    }

    private constructor() {
        this.waitingRoom = new Map();
        this.loadingRoom = new Map();
        this.gameService = GameService.getInstance();
        this.socketHandler = SocketHandler.getInstance();
        this.subscribeToSocket();
    }

    private subscribeToSocket(): void {
        this.socketHandler.subscribe(Event.PlayMultiplayerGame, (message: ICommonSocketMessage, player: string) => {
            this.matchPlayers(message, player);
        });
        this.socketHandler.subscribe(Event.CancelMatchmaking, (message: ICommonSocketMessage, player: string) => {
            this.cancelMatchmaking(message);
        });
        this.socketHandler.subscribe(Event.MatchmakingChange, (message: ICommonSocketMessage, player: string) => {
            this.onMatchmakingChange(player);
        });
    }

    public matchPlayers(message: ICommonSocketMessage, player: string): void {
        const data: ICommonGame = message.data as ICommonGame;
        if (this.waitingRoom.has(data.ressource_id)) {
            this.createMultiplayersGame(data, player);
        } else {
            this.waitingRoom.set(data.ressource_id, player);
            this.onMatchmakingChange(null);
        }
    }

    private createMultiplayersGame(data: ICommonGame, secondPlayer: string): void {
        const firstPlayer: string | undefined = this.waitingRoom.get(data.ressource_id);

        if (firstPlayer) {
            this.gameService.createGame([firstPlayer, secondPlayer], data, GameManager.MULTIPLAYER_WINNING_DIFFERENCES_COUNT);
            this.EndMatchmaking(secondPlayer, data);
            this.EndMatchmaking(firstPlayer, data);
            this.waitingRoom.delete(data.ressource_id);
            this.onMatchmakingChange(null);
        }
    }

    public matchLoadingGame(game: GameManager, player: string): void {
        (this.loadingRoom.has(game.game.id)) ?
        this.startMultiplayerGame(game) :
        this.loadingRoom.set(game.game.id, player);
    }

    private startMultiplayerGame(game: GameManager): void {
        this.gameService.startGame(game);
        this.loadingRoom.delete(game.game.id);
    }

    private EndMatchmaking(player: string, game: ICommonGame): void {
        const socketMessage: ICommonSocketMessage = {
            data: game,
            timestamp: new Date(),
        };
        this.socketHandler.sendMessage(Event.EndMatchmaking, socketMessage, player);
    }

    private cancelMatchmaking(message: ICommonSocketMessage): void {
        this.waitingRoom.delete(message.data as string);
        this.onMatchmakingChange(null);
    }

    private onMatchmakingChange(player: string | null): void {
        const room: string[] = [];
        this.waitingRoom.forEach((value: string, key: string) => {
            room[room.length++] = key;
        });
        const message: ICommonSocketMessage = {
            data: room,
            timestamp: new Date(),
        };

        player ? this.socketHandler.sendMessage(Event.MatchmakingChange, message, player) :
                 this.socketHandler.broadcastMessage(Event.MatchmakingChange, message);
    }
}

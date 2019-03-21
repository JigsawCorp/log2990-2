import { Event, ICommonSocketMessage } from "../../../../../common/communication/webSocket/socketMessage";
import { ChatFormaterService } from "./ChatFormater.service";
import { SocketHandlerService } from "./socketHandler.service";
import { SocketSubscriber } from "./socketSubscriber";

export class ChatService implements SocketSubscriber {
    private static instance: ChatService;
    private chat: HTMLElement;
    private container: HTMLElement;

    public static getInstance(): ChatService {
        if (!ChatService.instance) {
            ChatService.instance = new ChatService(new ChatFormaterService);
        }

        return ChatService.instance;
    }

    private constructor(public chatFormaterService: ChatFormaterService) {
        this.subscribeToSocket();
    }

    private subscribeToSocket(): void {
        SocketHandlerService.getInstance().subscribe(Event.UserDisconnected, this);
        SocketHandlerService.getInstance().subscribe(Event.NewUser, this);
        SocketHandlerService.getInstance().subscribe(Event.InvalidClick, this);
        SocketHandlerService.getInstance().subscribe(Event.DifferenceFound, this);
    }

    public  setChat(chat: HTMLElement, container: HTMLElement): void {
        this.chat = chat;
        this.container = container;
    }

    public notify(event: Event, message: ICommonSocketMessage): void {
        const data: string = this.chatFormaterService.formatMessage(event, message);
        this.appendToChat(data);
    }

    private appendToChat(data: string): void {
        const pre: HTMLElement = document.createElement("p");
        pre.innerText = data;
        this.chat.appendChild(pre);
        this.container.scrollTop = this.container.scrollHeight;
    }
}
import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { of, Observable } from "rxjs";
import { catchError } from "rxjs/operators";
import { Message } from "../../../../common/communication/message";
import { ICommonGameCard, POVType } from "../../../../common/model/gameCard";
import { Event, SocketService } from "./socket.service";
/*
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};
*/

@Injectable({
  providedIn: "root",
})
export class GamesCardViewService {
  private readonly BASE_URL: string = "http://localhost:3000/user/";
  private readonly GET_ALL_CARDS_URL: string = "gamecard/";

  public constructor(private http: HttpClient, private socketService: SocketService) { }

  public getGameCards(povType: POVType): Observable<Message> {
    return this.http.get<Message>(this.BASE_URL + this.GET_ALL_CARDS_URL)
        .pipe(
          catchError(this.handleError<Message>("getUsernameValidation")),
      );
  }

  public onGameCardAdded(): Observable<ICommonGameCard> {
    return new Observable<ICommonGameCard>((observer) => {
        this.socketService.onEvent(Event.GAME_CARD_ADDED).subscribe((gameCard: Message) => {
          const card: ICommonGameCard = JSON.parse(gameCard.body);
          observer.next(card);
        });
    });
  }

  public onGameCardDeleted(): Observable<ICommonGameCard> {
    return new Observable<ICommonGameCard>((observer) => {
        this.socketService.onEvent(Event.GAME_CARD_DELETED).subscribe((gameCard: Message) => {
          const card: ICommonGameCard = JSON.parse(gameCard.body);
          observer.next(card);
      });
    });
  }

  public onGameCardUpdated(): Observable<ICommonGameCard> {
    return new Observable<ICommonGameCard>((observer) => {
        this.socketService.onEvent(Event.GAME_CARD_UPDATED).subscribe((gameCard: Message) => {
          const card: ICommonGameCard = JSON.parse(gameCard.body);
          observer.next(card);
      });
    });
  }

  private handleError<T>(request: string, result?: T): (error: Error) => Observable<T> {
    return (error: Error): Observable<T> => {
        return of(result as T);
    };
}

}

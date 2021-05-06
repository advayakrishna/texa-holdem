import { Context, Methods } from "./.rtag/methods";
import {
  UserData,
  Result,
  GameStatus,
  HandStatus,
  PlayerState,
  ICreateGameRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IStartHandRequest,
  IProgressHandRequest,
} from "./.rtag/types";

interface InternalState {}

export class Impl implements Methods<InternalState> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): InternalState {
    return {};
  }
  joinGame(state: InternalState, user: UserData, ctx: Context, request: IJoinGameRequest): Result {
    return Result.success();
  }
  startGame(state: InternalState, user: UserData, ctx: Context, request: IStartGameRequest): Result {
    return Result.success();
  }
  startHand(state: InternalState, user: UserData, ctx: Context, request: IStartHandRequest): Result {
    return Result.success();
  }
  progressHand(state: InternalState, user: UserData, ctx: Context, request: IProgressHandRequest): Result {
    return Result.success();
  }
  getUserState(state: InternalState, user: UserData): PlayerState {
    return {
      players: [],
      hand: [],
      board: [],
      gameStatus: GameStatus.NOT_STARTED,
      handStatus: HandStatus.NOT_STARTED,
    };
  }
}

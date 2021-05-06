import {
  UserData,
  PlayerState as UserState,
  ICreateGameRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IStartHandRequest,
  IProgressHandRequest,
} from "./types";

export interface Context {
  rand(): number;
  randInt(limit?: number): number;
  time(): number;
}

export interface ModifiedResult {
  type: "modified";
}
export interface UnmodifiedResult {
  type: "unmodified";
  error?: string;
}
export type Result = ModifiedResult | UnmodifiedResult;
export const Result: { modified: () => ModifiedResult; unmodified: (error?: string) => UnmodifiedResult } = {
  modified: () => ({
    type: "modified",
  }),
  unmodified: (error?: string) => ({
    type: "unmodified",
    error,
  }),
};

export interface Methods<T> {
  createGame(user: UserData, ctx: Context, request: ICreateGameRequest): T;
  joinGame(state: T, user: UserData, ctx: Context, request: IJoinGameRequest): Result;
  startGame(state: T, user: UserData, ctx: Context, request: IStartGameRequest): Result;
  startHand(state: T, user: UserData, ctx: Context, request: IStartHandRequest): Result;
  progressHand(state: T, user: UserData, ctx: Context, request: IProgressHandRequest): Result;
  getUserState(state: T, user: UserData): UserState;
}

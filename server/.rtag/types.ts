export interface Card {
  rank: Rank;
  suit: Suit;
}
export enum Rank {
  ONE,
  TWO,
  THREE,
  FOUR,
  FIVE,
  SIX,
  SEVEN,
  EIGHT,
  NINE,
  TEN,
  JACK,
  QUEEN,
  KING,
  ACE,
}
export enum Suit {
  CLUBS,
  DIAMONDS,
  HEARTS,
  SPADES,
}
export enum GameStatus {
  NOT_STARTED,
  IN_PROGRESS,
}
export enum HandStatus {
  NOT_STARTED,
  PRE_FLOP,
  FLOP,
  TURN,
  RIVER,
}
export type PlayerName = string;
export interface PlayerState {
  players: PlayerName[];
  hand: Card[];
  board: Card[];
  gameStatus: GameStatus;
  handStatus: HandStatus;
}
export interface ICreateGameRequest {
}
export interface IJoinGameRequest {
}
export interface IStartGameRequest {
}
export interface IStartHandRequest {
}
export interface IProgressHandRequest {
}
export interface AnonymousUserData {
  type: "anonymous";
  id: string;
  name: string;
}
export type UserData = AnonymousUserData;

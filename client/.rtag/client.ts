import WebSocket from "isomorphic-ws";
import axios from "axios";
import jwtDecode from "jwt-decode";
import { decode, encode } from "@msgpack/msgpack";
import {
  UserData,
  PlayerState as UserState,
  ICreateGameRequest,
  IJoinGameRequest,
  IStartGameRequest,
  IStartHandRequest,
  IProgressHandRequest,
} from "./types";

export type StateId = string;

export class RtagClient {
  private callbacks: Record<string, (response: string | undefined) => void> = {};

  private constructor(private socket: WebSocket) {}

  public static getUserFromToken(token: string): UserData {
    return jwtDecode(token);
  }

  public static async loginAnonymous(origin: string = ""): Promise<string> {
    return (await axios.post(`${origin}/login/anonymous`)).data.token;
  }

  public static async createState(token: string, request: ICreateGameRequest, origin: string = ""): Promise<StateId> {
    const res = await axios.post(`${origin}/new`, request, { headers: { Authorization: "Bearer " + token } });
    return res.data.stateId;
  }

  public static connect(
    host: string,
    token: string,
    stateId: StateId,
    onStateChange: (state: UserState) => void
  ): Promise<RtagClient> {
    return new Promise((resolve, reject) => {
      const socket = new WebSocket(`ws://${host}/${stateId}`);
      socket.binaryType = "arraybuffer";
      const client = new RtagClient(socket);
      socket.onopen = () => {
        socket.send(token);
        resolve(client);
      };
      socket.onerror = () => {
        reject();
      };
      socket.onmessage = ({ data }) => {
        const { state, responses } = decode(data as ArrayBuffer) as {
          state: UserState;
          responses: Record<string, string | null>;
        };
        onStateChange(state);
        Object.entries(responses).forEach(([msgId, response]) => {
          if (msgId in client.callbacks) {
            client.callbacks[msgId](response ?? undefined);
            delete client.callbacks[msgId];
          }
        });
      };
    });
  }

  public joinGame(request: IJoinGameRequest): Promise<string | undefined> {
    const msgId = Math.random().toString(36).substring(2);
    this.socket.send(encode({ method: "joinGame", msgId, args: request }, { ignoreUndefined: true }));
    return new Promise((resolve) => {
      this.callbacks[msgId] = resolve;
    });
  }

  public startGame(request: IStartGameRequest): Promise<string | undefined> {
    const msgId = Math.random().toString(36).substring(2);
    this.socket.send(encode({ method: "startGame", msgId, args: request }, { ignoreUndefined: true }));
    return new Promise((resolve) => {
      this.callbacks[msgId] = resolve;
    });
  }

  public startHand(request: IStartHandRequest): Promise<string | undefined> {
    const msgId = Math.random().toString(36).substring(2);
    this.socket.send(encode({ method: "startHand", msgId, args: request }, { ignoreUndefined: true }));
    return new Promise((resolve) => {
      this.callbacks[msgId] = resolve;
    });
  }

  public progressHand(request: IProgressHandRequest): Promise<string | undefined> {
    const msgId = Math.random().toString(36).substring(2);
    this.socket.send(encode({ method: "progressHand", msgId, args: request }, { ignoreUndefined: true }));
    return new Promise((resolve) => {
      this.callbacks[msgId] = resolve;
    });
  }

  public disconnect(): void {
    this.socket.close();
  }
}

import module from "module";
import dependencyTree from "dependency-tree";
import chokidar from "chokidar";
import seedrandom from "seedrandom";
import { decode, encode } from "@msgpack/msgpack";
import { onNewUserState } from "./proxy";
import { UserData, ICreateGameRequest } from "./types";

const deps = dependencyTree.toList({
  directory: ".",
  filename: module.createRequire(import.meta.url).resolve("../impl"),
  filter: (path) => !path.includes(".rtag") && !path.includes("node_modules"),
});
let impl = new (await import("../impl")).Impl();
chokidar.watch(deps).on("change", async () => {
  impl = new (await import(`../impl.ts#${Math.random()}`)).Impl();
});

type StateId = string;
type State = ReturnType<typeof impl.createGame>;
interface UpdateRequest {
  method: string;
  msgId: string;
  args: any;
}

const states: Map<StateId, State> = new Map();
const changedStates: Set<StateId> = new Set();
const userResponses: Map<StateId, Map<string, Record<string, string | null>>> = new Map();
const subscriptions: Map<StateId, Set<UserData>> = new Map();
const rng = seedrandom(Math.random().toString());

export default class Store {
  constructor() {
    setInterval(() => {
      changedStates.forEach((stateId) => {
        const responses = userResponses.get(stateId);
        subscriptions.get(stateId)!.forEach((user) => {
          onNewUserState(stateId, user, updateMessage(stateId, user, responses?.get(user.id) ?? {}));
        });
        userResponses.delete(stateId);
      });
      userResponses.forEach((responses, stateId) => {
        subscriptions.get(stateId)!.forEach((user) => {
          if (responses.has(user.id)) {
            onNewUserState(stateId, user, updateMessage(stateId, user, responses.get(user.id)!));
          }
        });
      });
      changedStates.clear();
      userResponses.clear();
    }, 100);
  }
  newState(stateId: StateId, user: UserData, req: ICreateGameRequest) {
    states.set(stateId, impl.createGame(user, ctx(), req));
  }
  handleUpdate(stateId: StateId, user: UserData, data: Buffer) {
    const { method, args, msgId } = decode(data) as UpdateRequest;
    const result = getResult(states.get(stateId)!, user, method, args);
    if (result !== undefined) {
      if (result.type === "modified") {
        changedStates.add(stateId);
      }
      const response = result.type === "modified" ? null : result.error ?? null;
      if (!userResponses.has(stateId)) {
        userResponses.set(stateId, new Map([[user.id, { [msgId]: response }]]));
      } else {
        if (!userResponses.get(stateId)!.has(user.id)) {
          userResponses.get(stateId)!.set(user.id, { [msgId]: response });
        } else {
          userResponses.get(stateId)!.get(user.id)![msgId] = response;
        }
      }
    }
  }
  hasState(stateId: StateId) {
    return states.has(stateId);
  }
  getUserState(stateId: StateId, user: UserData) {
    return states.has(stateId) ? updateMessage(stateId, user, {}) : undefined;
  }
  subscribeUser(stateId: StateId, user: UserData) {
    if (!subscriptions.has(stateId)) {
      subscriptions.set(stateId, new Set([user]));
    } else {
      subscriptions.get(stateId)!.add(user);
    }
  }
  unsubscribeUser(stateId: StateId, user: UserData) {
    const users = subscriptions.get(stateId)!;
    if (users.size > 1) {
      users.delete(user);
    } else {
      subscriptions.delete(stateId);
    }
  }
}

function getResult(state: State, user: UserData, method: string, args: any) {
  switch (method) {
    case "joinGame":
      return impl.joinGame(state, user, ctx(), args);
    case "startGame":
      return impl.startGame(state, user, ctx(), args);
    case "startHand":
      return impl.startHand(state, user, ctx(), args);
    case "progressHand":
      return impl.progressHand(state, user, ctx(), args);
    default:
      return undefined;
  }
}

function updateMessage(stateId: StateId, user: UserData, responses: Record<string, string | null>) {
  return encode({ state: impl.getUserState(states.get(stateId)!, user), responses }, { ignoreUndefined: true });
}

function ctx() {
  return {
    rand: () => rng(),
    randInt: (limit?: number) => (limit === undefined ? rng.int32() : Math.floor(rng() * limit)),
    time: () => Date.now(),
  };
}

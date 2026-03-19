import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useSettings } from "./RoomSettingContext";
import { useSocket } from "./SocketContext";
import { emitGameStart, emitGameStateRequest, offGameState, onGameState } from "../services/Socket";

const groupContext = createContext();

const initialState = {

    groups : [[0,"Drawing"],[0,"Guessing"]],
    currentWord : "",
    turnsEndAt : 0,

}

function reducer(state,action){

    switch(action.type){

        case "SET_TEAM1_STATUS":
            return {...state,groups : [[state.groups[0][0],action.payload],state.groups[1]]};
        case "SET_TEAM1_SCORE":
            return {...state,groups : [[action.payload,state.groups[0][1]],state.groups[1]]};
        case "SET_TEAM2_SCORE":
            return {...state,groups : [state.groups[0],[action.payload,state.groups[1][1]]]};
        case "SET_TEAM2_STATUS":
            return {...state,groups: [state.groups[0],[state.groups[1][0],action.payload]]};
        case "SET_CURRENT_WORD":
            return {...state,currentWord : action.payload};
        case "SET_TURN_END":
            return {...state,turnsEndAt: action.payload};
        case "SET_GAME_STATE":
            return {
                ...state,
                groups: action.payload.groups || state.groups,
                currentWord: action.payload.currentWord || "",
                turnsEndAt: action.payload.turnsEndAt || 0,
            };
        default:
            return state;
    }

}

const getWord = (settings) => {

    switch(settings.difficulty_level){
        case "EASY_WORDS":
            return settings.EASY_WORDS;
        case "MEDIUM_WORDS":
            return settings.MEDIUM_WORDS;
        case "HARD_WORDS":
            return settings.HARD_WORDS;
        case "FUNNY_WORDS":
            return settings.FUNNY_WORDS;
        case "INDIAN_WORDS":
            return settings.INDIAN_WORDS;
        case "CUSTOM":
            return settings.MEDIUM_WORDS;
        default:
            return settings.MEDIUM_WORDS;
    }
}

const GroupContext = ({children}) => {

    const {state : settings} = useSettings();
    const { state: socketState } = useSocket();
    const { roomCode } = socketState;

    const [state,dispatch] = useReducer(reducer,initialState);

    const startTurn = (roomCodeOverride) => {
        const effectiveRoomCode = roomCodeOverride || roomCode;
        if (!effectiveRoomCode) {
            return { ok: false, reason: "Room code missing" };
        }
        const wordPool = getWord(settings) || [];
        if (!Array.isArray(wordPool) || wordPool.length === 0) {
            return { ok: false, reason: "Word pool is empty" };
        }
        const turnMs = Number(settings.time) * 60 * 1000;

        emitGameStart({
            roomCode: effectiveRoomCode,
            wordPool,
            turnMs,
            groups: state.groups,
        });

        // Pull latest authoritative game state right after starting.
        emitGameStateRequest({ roomCode: effectiveRoomCode });

        return { ok: true };

    }

    const nextTurn = () => {
        // Server controls turn transitions.
    }

    useEffect(() => {
        const handleGameState = (payload) => {
            dispatch({ type: "SET_GAME_STATE", payload });
        };

        onGameState(handleGameState);

        if (roomCode) {
            emitGameStateRequest({ roomCode });
        }

        return () => {
            offGameState(handleGameState);
        };
    }, [roomCode]);

    const value = useMemo(() => ({state,dispatch,startTurn,nextTurn}),[state, roomCode, settings]);

    return(

        <groupContext.Provider value = {value}>
            {children}
        </groupContext.Provider>
    )

}

export const useGroupContext = () => {

    const curr = useContext(groupContext);

    if (!curr){
        throw new Error ("Group Context cant be used");
    }

    return curr;

}

export default GroupContext;
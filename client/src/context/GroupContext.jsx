import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useSettings } from "./RoomSettingContext";
import { useSocket } from "./SocketContext";
import { emitGameStart, emitGameStateRequest, offGameState, offRoomSnapshot, onGameState, onRoomSnapshot } from "../services/Socket";

const groupContext = createContext();

const initialState = {
    currentWord : "",
    turnsEndAt : 0,
    currentWordVisible : false,
    currentTeamIndex : 0,
    phase : "lobby",

}

function reducer(state,action){

    switch(action.type){
        case "SET_CURRENT_WORD":
            return {...state,currentWord : action.payload};
        case "SET_TURN_END":
            return {...state,turnsEndAt: action.payload};
        case "SET_GAME_STATE":
            return {
                ...state,
                currentWord: action.payload.currentWord || "",
                turnsEndAt: action.payload.turnsEndAt || 0,
                currentWordVisible: action.payload.currentWordVisible ?? false,
                currentTeamIndex: action.payload.currentTeamIndex ?? 0,
                phase: action.payload.phase || "playing",
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
    const { roomCode, groups: roomTeams } = socketState;

    const [state,dispatch] = useReducer(reducer,initialState);

    const toGameGroups = (teams = []) => {
        const first = teams[0] || {};
        const second = teams[1] || {};

        return [
            [Number(first.score) || 0, "Drawing"],
            [Number(second.score) || 0, "Guessing"],
        ];
    };

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
            groups: toGameGroups(roomTeams),
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

        const handleRoomSnapshot = (payload) => {
            if (!payload?.ok) return;

            dispatch({
                type: "SET_GAME_STATE",
                payload: {
                    currentWord: payload.game?.currentWord || "",
                    turnsEndAt: payload.game?.turnsEndAt || 0,
                    currentWordVisible: payload.game?.currentWordVisible ?? false,
                    currentTeamIndex: payload.game?.currentTeamIndex ?? 0,
                    phase: payload.game?.phase || "lobby",
                },
            });
        };

        onGameState(handleGameState);
        onRoomSnapshot(handleRoomSnapshot);

        if (roomCode) {
            emitGameStateRequest({ roomCode });
        }

        return () => {
            offGameState(handleGameState);
            offRoomSnapshot(handleRoomSnapshot);
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
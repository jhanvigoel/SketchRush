import { createContext, useContext, useEffect, useMemo, useReducer } from "react";
import { useSettings } from "./RoomSettingContext";
import { useSocket } from "./SocketContext";
import { emitGameStart, emitGameStateRequest, offGameState, offRoomSnapshot, onGameState, onRoomSnapshot } from "../services/Socket";

const groupContext = createContext();

const initialState = {
    groups: [[0, "Waiting"], [0, "Waiting"]],
    currentWord : "",
    turnsEndAt : 0,
    currentWordVisible : false,
    currentTeamIndex : 0,
    phase : "lobby",
    winner: null,
    roundLimit: 0,
    roundsPlayed: 0,
    turnsPlayed: 0,
    currentRound: 1,
}

function reducer(state,action){

    switch(action.type){
        case "SET_CURRENT_WORD":
            return {...state,currentWord : action.payload};
        case "SET_TURN_END":
            return {...state,turnsEndAt: action.payload};
        case "SET_GAME_STATE": {
            const p = action.payload || {};
            const roundLimit = Number.isInteger(p.roundLimit) ? p.roundLimit : state.roundLimit;
            const roundsPlayed = Number.isInteger(p.roundsPlayed) ? p.roundsPlayed : state.roundsPlayed;
            const turnsPlayed = Number.isInteger(p.turnsPlayed) ? p.turnsPlayed : state.turnsPlayed;
            const currentRound = p.currentRound !== undefined
                ? p.currentRound
                : (roundLimit > 0 ? Math.min(roundLimit, roundsPlayed + 1) : 1);

            return {
                ...state,
                groups: p.groups || state.groups,
                currentWord: p.currentWord !== undefined ? p.currentWord : state.currentWord,
                turnsEndAt: p.turnsEndAt !== undefined ? p.turnsEndAt : state.turnsEndAt,
                currentWordVisible: typeof p.currentWordVisible === 'boolean' ? p.currentWordVisible : state.currentWordVisible,
                currentTeamIndex: Number.isInteger(p.currentTeamIndex) ? p.currentTeamIndex : state.currentTeamIndex,
                phase: p.phase || state.phase,
                winner: p.winner !== undefined ? p.winner : state.winner,
                roundLimit,
                roundsPlayed,
                turnsPlayed,
                currentRound,
            };
        }
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
        const roundLimit = Number(settings.rounds) || 1;

        emitGameStart({
            roomCode: effectiveRoomCode,
            wordPool,
            turnMs,
            groups: toGameGroups(roomTeams),
            roundLimit,
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
            if (!payload) return;
            // Public game:state does not include personalized drawer word or visibility.
            // Omit currentWord and currentWordVisible so we don't wipe out the active drawer's state.
            const { currentWord, currentWordVisible, ...publicState } = payload;
            dispatch({ type: "SET_GAME_STATE", payload: publicState });
        };

        const handleRoomSnapshot = (payload) => {
            if (!payload?.ok) return;

            const nextGroups = Array.isArray(payload.teams)
                ? payload.teams
                : Array.isArray(payload.game?.groups)
                    ? payload.game.groups
                    : undefined;

            const safeWord = payload.game?.currentWord !== undefined
                ? payload.game.currentWord
                : (payload.currentWord !== undefined ? payload.currentWord : undefined);

            const safeVisible = payload.game?.currentWordVisible !== undefined
                ? payload.game.currentWordVisible
                : (payload.currentWordVisible !== undefined ? payload.currentWordVisible : undefined);

            dispatch({
                type: "SET_GAME_STATE",
                payload: {
                    groups: nextGroups,
                    currentWord: safeWord,
                    turnsEndAt: payload.game?.turnsEndAt ?? payload.game?.turnEndsAt ?? 0,
                    currentWordVisible: safeVisible,
                    currentTeamIndex: payload.game?.currentTeamIndex ?? 0,
                    phase: payload.game?.phase || "lobby",
                    winner: payload.game?.winner ?? null,
                    roundLimit: payload.game?.roundLimit ?? 0,
                    roundsPlayed: payload.game?.roundsPlayed ?? 0,
                    turnsPlayed: payload.game?.turnsPlayed ?? 0,
                    currentRound: payload.game?.currentRound ?? 1,
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
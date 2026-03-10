import { createContext, useContext, useMemo, useReducer, useRef } from "react";
import { useSettings } from "./RoomSettingContext";

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

const shuffle = (arr) => {

    const a = [...arr];

    const len = a.length;

    for (let idx = len-1 ; idx >= 0 ; idx --){

        const jdx = Math.floor(Math.random() * (idx+1));

        [a[idx],a[jdx]] = [a[jdx],a[idx]];

    }

    return a;

}

const GroupContext = ({children}) => {

    const {state : settings} = useSettings();

    const [state,dispatch] = useReducer(reducer,initialState);

    const bagRef = useRef([]);

    const usedRef = useRef([]);

    const nextWord = () => {

        if (bagRef.current.length === 0){

            const pool = getWord(settings);

            bagRef.current = shuffle(pool);
            usedRef.current = [];

        }

        const word = bagRef.current.pop();
        usedRef.current.push(word);

        return word;
    };

    const startTurn = () => {

        bagRef.current = [];
        usedRef.current = [];

        const word = nextWord();

        dispatch({type : "SET_CURRENT_WORD",payload : word});
        dispatch({type : "SET_TURN_END", payload : Date.now() + (Number(settings.time) * 60 * 1000)});

    }

    const nextTurn = () => {

        const curr = (state.groups[0][1] === "Drawing") ? "Guessing" : "Drawing";

        dispatch({type : "SET_TEAM1_STATUS", payload : curr});

        const curr2 = (state.groups[1][1] === "Drawing") ? "Guessing" : "Drawing";

        dispatch({type : "SET_TEAM2_STATUS", payload : curr2});

        startTurn();

    }

    const value = useMemo(() => ({state,dispatch,startTurn,nextTurn}),[state]);

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
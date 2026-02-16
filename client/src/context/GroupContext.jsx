import { createContext, useMemo, useReducer } from "react";
import { useSettings } from "./RoomSettingContext";

const groupContext = createContext();

const initialState = {

    groups : [[0,"Drawing"],[0,"Guessing"]],

}

function reducer(state,action){

    switch(action.type){

        case "SET_TEAM1_STATUS":
            return {...state,groups : [[state.groups[0][0],action.payload],state.groups[1]]};
        case "SET_TEAM1_SCORE":
            return {...state,groups : [[action.payload],state.groups[0][1],state.groups[1]]};
        case "SET_TEAM2_SCORE":
            return {...state,groups : [state.groups[0],[action.payload,state.groups[1][1]]]};
        case "SET_TEAM2_STATUS":
            return {...state,groups: [state.groups[0],[state.groups[1][0],action.payload]]};
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
            return settings.FUNNY_wORDS;
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

    const words = getWord(settings);

    const [state,dispatch] = useReducer(reducer,initialState);

    const value = useMemo(() => {state,dispatch},[state]);

    return(

        <groupContext.Provider value = {value}>
            {children}
        </groupContext.Provider>
    )

}

export const useGroupContext = () => {

    const curr = useContext(groupContext);

    if (!curr){
        throw new err ("Group Context cant be used");
    }

    return curr;

}

export default GroupContext;
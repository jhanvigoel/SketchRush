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

const GroupContext = ({children}) => {

    const {state1,dispatch1} = useSettings();
     const {words,difficulty_level,EASY_WORDS,MEDIUM_WORDS,HARD_WORDS,FUNNY_WORDS,INDIAN_WORDS} = state1;

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
import React, { createContext, useContext, useReducer, useMemo } from 'react'

const settingContext = createContext();

const initialSettings = {

    time : 3,
    hints : 1,
    rounds : 3,
    words : [],
    difficulty_level : "MEDIUM_WORDS",
    EASY_WORDS : [
        "Cat",
        "Dog",
        "House",
        "Car",
        "Sun",
        "Moon",
        "Tree",
        "Apple",
        "Ball",
        "Cup",
        "Hat",
        "Fish",
        "Chair",
        "Clock",
        "Book",
        "Flower",
        "Ice cream",
        "Star",
        "Key",
        "Phone"
    ],

    MEDIUM_WORDS : [
        "Backpack",
        "Laptop",
        "Umbrella",
        "Guitar",
        "Camera",
        "Mountain",
        "Bridge",
        "Pizza",
        "Rocket",
        "Pirate",
        "Superhero",
        "Rainbow",
        "Snowman",
        "Candle",
        "Mirror",
        "Castle",
        "Robot",
        "Clock tower",
        "Hot air balloon",
        "Treasure"
    ],

     HARD_WORDS : [
        "Nightmare",
        "Confusion",
        "Freedom",
        "Gravity",
        "Invisible",
        "Secret",
        "Time travel",
        "Black hole",
        "Emotion",
        "Reflection",
        "Illusion",
        "Chaos",
        "Silence",
        "Fear",
        "Dream",
        "Balance",
        "Shadow",
        "Memory",
        "Parallel universe",
        "Teleport"
    ],

    FUNNY_WORDS : [
        "Angry banana",
        "Dancing penguin",
        "Sleepy zombie",
        "Flying cow",
        "Broken Wi-Fi",
        "Crying onion",
        "Confused robot",
        "Sneezing dragon",
        "Lazy superhero",
        "Scared cactus",
        "Running fridge",
        "Singing potato",
        "Exploding cake",
        "Laughing ghost",
        "Disco dinosaur"
    ],

    INDIAN_WORDS : [
        "Auto-rickshaw",
        "Cricket",
        "Chai",
        "Temple",
        "Festival",
        "Dosa",
        "Diwali",
        "Rickshaw",
        "School bag",
        "Tiffin",
        "Monsoon",
        "Ladoo",
        "Train platform",
        "Traffic signal",
        "Street food"
    ]

}

function reducer (state,action){

    switch (action.type){

        case "SET_TIME":
            return {...state,time : action.payload};
        case "SET_HINTS":
            return {...state,hints : action.payload};
        case "SET_ROUNDS":
            return {...state,rounds: action.payload};
        case "SET_WORDS":
            return {...state,words: action.payload};
        case "SET_LEVEL":
            return {...state,difficulty_level: action.payload};
        default:
            return state;
    }
}

const RoomSettingContext = ({children}) => {

    const [state,dispatch] = useReducer(reducer,initialSettings);

    const value = useMemo(() => ({ state, dispatch }), [state]);

  return (

    <settingContext.Provider value = {value}>

        {children}
        
    </settingContext.Provider>
  )
}

export const useSettings = () => {

    const curr = useContext(settingContext);

    if (!curr){
        throw new Error ("settings context error");
    }

    return curr;

}

export default RoomSettingContext
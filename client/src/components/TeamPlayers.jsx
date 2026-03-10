import React from 'react'
import { useGroupContext } from '../context/GroupContext'

const TeamPlayers = ({teamName, players, index}) => {

    const {state} = useGroupContext();
    const {groups} = state;

    const teamIdx = Number(index);
    const score = groups?.[teamIdx]?.[0] ?? 0;
    const status = groups?.[teamIdx]?.[1] ?? 'Waiting';

  return (
    <div>

        <div className = "rounded-lg border-2 border-black grid grid-cols-1 justify-center">

            <div className = "text-5xl font-bold"> Team : {teamName}</div>

            <ul className = "space-y-2">

                {players && players.length > 0 ? (

                    players.map((player) => (
                        <li key = {player.id} className = "text-3xl">{player.name}</li>
                    ))
                ) : (
                    <li className = "text-6xl"> Waiting ..</li>
                )}
            </ul>

            <div className = "text-3xl font-bold"> Score : {score}</div>
            <div className = "text-3xl font-bold"> Status : {status} </div>
        </div>
    </div>
  )
}

export default TeamPlayers
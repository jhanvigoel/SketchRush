import React from 'react'

const TeamPlayers = ({teamName,players,index}) => {
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
        </div>
    </div>
  )
}

export default TeamPlayers
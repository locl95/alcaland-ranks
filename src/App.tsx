import React, {useEffect, useState} from 'react';
import './App.css';
import {Ladder} from "./features/ladder/Ladder";
import {characters, raiderioFetch} from "./utils/utils";
import {gamerFromRaiderioProfile} from "./features/ladder/types";
import {RaiderioProfile} from "./utils/raiderio";
import {DungeonLadder} from "./features/dungeon/DungeonLadder";
import {gamerDungeonFromRaiderioProfile} from "./features/dungeon/types";

function App() {

    const [data, setData] = useState<RaiderioProfile[]>([])

    useEffect(() => {
        async function foo() {
            const profiles = await Promise.all(characters.map(async (c) =>
                await raiderioFetch<RaiderioProfile>(`/characters/profile?region=${c.region}&realm=${c.realm}&name=${c.name}&fields=mythic_plus_scores_by_season%3Acurrent,mythic_plus_best_runs%3Aall`)))
            setData(profiles)
        }
        foo()
    }, [])

    console.log(data)

  return (
    <div className="App">
         <Ladder
            gamers={data.map(rio => gamerFromRaiderioProfile(rio)).sort((a, b) => b.score - a.score)}
         />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "UNDR")).sort((a,b) => b.score - a.score)}
        />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "NL")).sort((a,b) => b.score - a.score)}
        />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "FH")).sort((a,b) => b.score - a.score)}
        />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "BH")).sort((a,b) => b.score - a.score)}
        />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "HOI")).sort((a,b) => b.score - a.score)}
        />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "VP")).sort((a,b) => b.score - a.score)}
        />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "ULD")).sort((a,b) => b.score - a.score)}
        />
        <DungeonLadder
            gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "NELT")).sort((a,b) => b.score - a.score)}
        />
    </div>
  );
}

export default App;

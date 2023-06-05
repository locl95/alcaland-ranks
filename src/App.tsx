import React, {useEffect, useState} from 'react';
import './App.css';
import {Ladder} from "./features/ladder/Ladder";
import {characters, Class, classes, raiderioFetch} from "./utils/utils";
import {gamerFromRaiderioProfile} from "./features/ladder/types";
import {RaiderioProfile} from "./utils/raiderio";
import {DungeonLadder} from "./features/dungeon/DungeonLadder";
import {gamerDungeonFromRaiderioProfile} from "./features/dungeon/types";
import {Col, Row} from "antd";
import {RankLadder} from "./features/rank/RankLadder";
import {gamerRankFromRaiderioProfile} from "./features/rank/types";
import {gamerRankSpecsFromRaiderioProfile} from "./features/rankSpecs/types";
import {RankSpecsLadder} from "./features/rankSpecs/RankSpecsLadder";

function App() {

    const [data, setData] = useState<RaiderioProfile[]>([])

    useEffect(() => {
        async function foo() {
            const profiles = await Promise.all(characters.map(async (c) =>
                await raiderioFetch<RaiderioProfile>(`/characters/profile?region=${c.region}&realm=${c.realm}&name=${c.name}&fields=mythic_plus_scores_by_season%3Acurrent,mythic_plus_best_runs%3Aall,mythic_plus_ranks`)))
            setData(profiles)
        }
        foo()
    }, [])

    console.log(data)
    data.forEach(rio => console.log(rio.mythic_plus_ranks))

  return (
    <div className="App">
         <Ladder
             caption={"General Score"}
             gamers={data.map(rio => gamerFromRaiderioProfile(rio)).sort((a, b) => b.score - a.score)}
         />
        <RankLadder
            caption={"General Rank"}
            gamerRank={data.map(rio => gamerRankFromRaiderioProfile(rio)).sort((a, b) => a.world - b.world)}
        />
        <RankSpecsLadder
            caption={"Specs Rank"}
            gamerRank={data.flatMap(rio => {
                const classWithSpecs: Class = classes.find(c => c.class === rio.class)!
                return classWithSpecs.specs.map(spec => gamerRankSpecsFromRaiderioProfile(rio, spec))
            }).filter(gr => gr.world > 0).sort((a,b) => a.world - b.world)}
        />
        <Row>
            <Col span={12}>
                <DungeonLadder
                    caption={"Underrot"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "UNDR")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <DungeonLadder
                    caption={"Neltharion's Lair"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "NL")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <DungeonLadder
                    caption={"Freehold"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "FH")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <DungeonLadder
                    caption={"Brackenhide Hollow"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "BH")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <DungeonLadder
                    caption={"Halls of Infusion"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "HOI")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <DungeonLadder
                    caption={"Vortex Pinnacle"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "VP")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <DungeonLadder
                    caption={"Uldaman: Legacy of Tyr"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "ULD")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <DungeonLadder
                    caption={"Neltharus"}
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "NELT")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
    </div>
  );
}

export default App;

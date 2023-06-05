import React, {useEffect, useState} from 'react';
import './App.css';
import {Ladder} from "./features/ladder/Ladder";
import {characters, Class, classes, raiderioFetch} from "./utils/utils";
import {gamerFromRaiderioProfile} from "./features/ladder/types";
import {RaiderioProfile} from "./utils/raiderio";
import {DungeonLadder} from "./features/dungeon/DungeonLadder";
import {gamerDungeonFromRaiderioProfile} from "./features/dungeon/types";
import {Col, Row} from "antd";
import undrbg from './assets/dungeons/UNDR.webp';
import nlbg from './assets/dungeons/NL.webp';
import fhbg from './assets/dungeons/FH.webp';
import bhbg from './assets/dungeons/BH.webp';
import hoibg from './assets/dungeons/HOI.webp';
import vpbg from './assets/dungeons/VP.webp';
import uldbg from './assets/dungeons/ULD.webp';
import neltbg from './assets/dungeons/NELT.webp';
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
            gamers={data.map(rio => gamerFromRaiderioProfile(rio)).sort((a, b) => b.score - a.score)}
         />
        <RankLadder
            gamerRank={data.map(rio => gamerRankFromRaiderioProfile(rio)).sort((a, b) => a.world - b.world)}
        />
        <RankSpecsLadder
            gamerRank={data.flatMap(rio => {
                const classWithSpecs: Class = classes.find(c => c.class === rio.class)!
                return classWithSpecs.specs.map(spec => gamerRankSpecsFromRaiderioProfile(rio, spec))
            }).filter(gr => gr.world > 0).sort((a,b) => a.world - b.world)}
        />
        <Row>
            <Col span={12}>
                <img src={undrbg} alt="UNDR"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "UNDR")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <img src={nlbg} alt="NL"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "NL")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <img src={fhbg} alt="FH"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "FH")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <img src={bhbg} alt="BH"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "BH")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <img src={hoibg} alt="HOI"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "HOI")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <img src={vpbg} alt="VP"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "VP")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
        <Row>
            <Col span={12}>
                <img src={uldbg} alt="ULD"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "ULD")).sort((a,b) => b.score - a.score)}
                />
            </Col>
            <Col span={12}>
                <img src={neltbg} alt="NELT"/>
                <DungeonLadder
                    gamersDungeon={data.map(rio => gamerDungeonFromRaiderioProfile(rio, "NELT")).sort((a,b) => b.score - a.score)}
                />
            </Col>
        </Row>
    </div>
  );
}

export default App;

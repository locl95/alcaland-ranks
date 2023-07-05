import React, {useEffect, useState} from 'react';
import './App.css';
import {Ladder} from "./features/ladder/Ladder";
import {characters, Class, classes, raiderioFetch} from "./utils/utils";
import {gamerFromRaiderioProfile} from "./features/ladder/types";
import {RaiderioCutoff, RaiderioProfile} from "./utils/raiderio";
import {DungeonLadder} from "./features/dungeon/DungeonLadder";
import {gamerDungeonFromRaiderioProfile} from "./features/dungeon/types";
import {Col, ConfigProvider, Row, theme} from "antd";
import {RankLadder} from "./features/rank/RankLadder";
import {gamerRankFromRaiderioProfile} from "./features/rank/types";
import {gamerRankSpecsFromRaiderioProfile} from "./features/rankSpecs/types";
import {RankSpecsLadder} from "./features/rankSpecs/RankSpecsLadder";

function App() {

    const [raiderioProfiles, setRaiderioProfiles] = useState<RaiderioProfile[]>([])
    const [raiderioCutoff, setRaiderioCutoff] = useState<RaiderioCutoff>()

    useEffect(() => {
        async function foo() {
            const profiles = await Promise.all(characters.map(async (c) =>
                await raiderioFetch<RaiderioProfile>(`/characters/profile?region=${c.region}&realm=${c.realm}&name=${c.name}&fields=mythic_plus_scores_by_season%3Acurrent,mythic_plus_best_runs%3Aall,mythic_plus_ranks,mythic_plus_alternate_runs%3Aall`)))
            const cutoffs = await raiderioFetch<RaiderioCutoff>("/mythic-plus/season-cutoffs?season=season-df-2&region=eu")
            setRaiderioProfiles(profiles)
            setRaiderioCutoff(cutoffs)
        }

        foo()
    }, [])

    console.log(raiderioProfiles)

    return (
        <ConfigProvider
            theme={{
                algorithm: theme.darkAlgorithm,
            }}
        >
            <div className="App">
                <Ladder
                    caption={"General Score"}
                    loading={raiderioProfiles.length === 0}
                    gamers={raiderioProfiles.map(rio => gamerFromRaiderioProfile(rio, raiderioCutoff!)).sort((a, b) => b.score - a.score)}
                />
                <RankLadder
                    caption={"General Rank"}
                    loading={raiderioProfiles.length === 0}
                    gamerRank={raiderioProfiles.map(rio => gamerRankFromRaiderioProfile(rio)).sort((a, b) => a.world - b.world)}
                />
                <RankSpecsLadder
                    caption={"Specs Rank"}
                    loading={raiderioProfiles.length === 0}
                    gamerRank={raiderioProfiles.flatMap(rio => {
                        const classWithSpecs: Class = classes.find(c => c.class === rio.class)!
                        return classWithSpecs.specs.map(spec => gamerRankSpecsFromRaiderioProfile(rio, spec))
                    }).filter(gr => gr.world > 0).sort((a, b) => a.world - b.world)}
                />
                <Row>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Underrot"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "UNDR")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Neltharion's Lair"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "NL")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Freehold"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "FH")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Brackenhide Hollow"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "BH")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Halls of Infusion"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "HOI")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Vortex Pinnacle"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "VP")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Uldaman: Legacy of Tyr"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "ULD")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12}>
                        <DungeonLadder
                            caption={"Neltharus"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "NELT")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
            </div>
        </ConfigProvider>
    );
}

export default App;

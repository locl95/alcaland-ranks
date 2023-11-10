import React, {useEffect, useState} from 'react';
import './App.css';
import {Ladder} from "./features/ladder/Ladder";
import {easyFetch} from "./utils/utils";
import {gamerFromRaiderioProfile} from "./features/ladder/types";
import {RaiderioProfile} from "./utils/raiderio";
import {DungeonLadder} from "./features/dungeon/DungeonLadder";
import {gamerDungeonFromRaiderioProfile} from "./features/dungeon/types";
import {Col, ConfigProvider, Row, theme} from "antd";
import {RankLadder} from "./features/rank/RankLadder";
import {gamerRankFromRaiderioProfile} from "./features/rank/types";
import {gamerRankSpecsFromRaiderioProfile} from "./features/rankSpecs/types";
import {RankSpecsLadder} from "./features/rankSpecs/RankSpecsLadder";
import {useParams} from "react-router-dom";

function App() {

    const [raiderioProfiles, setRaiderioProfiles] = useState<RaiderioProfile[]>([])
    const { viewId} = useParams()

    useEffect(() => {

        async function getData() {
            const profiles = await easyFetch<RaiderioProfile[]>("GET", `/views/${viewId}/data`, undefined, `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`)
            setRaiderioProfiles(profiles)
        }
        getData()
    }, [viewId])

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
                    gamers={raiderioProfiles.map(rio => gamerFromRaiderioProfile(rio)).sort((a, b) => b.score - a.score)}
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
                        return rio.mythicPlusRanks.specs.map(mythicPlusRank => gamerRankSpecsFromRaiderioProfile(rio, mythicPlusRank))
                    }).filter(gr => gr.world > 0).sort((a, b) => b.score - a.score)}
                />
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Underrot"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "UNDR")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Neltharion's Lair"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "NL")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Freehold"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "FH")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Brackenhide Hollow"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "BH")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Halls of Infusion"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "HOI")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Vortex Pinnacle"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "VP")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Uldaman: Legacy of Tyr"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "ULD")).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
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

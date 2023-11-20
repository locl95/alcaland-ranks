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
    const [raiderioCachedProfiles, setRaiderioCachedProfiles] = useState<RaiderioProfile[]>([])
    const {viewId} = useParams()

    useEffect(() => {

        async function getData() {
            const [profiles, cachedProfiles] = await Promise.all([
                easyFetch<RaiderioProfile[]>("GET", `/views/${viewId}/data`, undefined, `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`),
                easyFetch<RaiderioProfile[]>("GET", `/views/${viewId}/cached-data`, undefined, `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`)
            ]);
            setRaiderioProfiles(profiles)
            setRaiderioCachedProfiles(cachedProfiles)
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
                    gamers={raiderioProfiles.map(rio => gamerFromRaiderioProfile(rio, raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                />
                <RankLadder
                    caption={"General Rank"}
                    loading={raiderioProfiles.length === 0}
                    gamerRank={raiderioProfiles.map(rio => gamerRankFromRaiderioProfile(rio, raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => a.world - b.world)}
                />
                <RankSpecsLadder
                    caption={"Specs Rank"}
                    loading={raiderioProfiles.length === 0}
                    gamerRank={raiderioProfiles.flatMap(rio => {
                        return rio.mythicPlusRanks.specs.map(mythicPlusRank => gamerRankSpecsFromRaiderioProfile(rio, mythicPlusRank, raiderioCachedProfiles.find(c => c.id === rio.id)?.mythicPlusRanks.specs.find(s => s.name === mythicPlusRank.name)))
                    }).filter(gr => gr.world > 0).sort((a, b) => b.score - a.score)}
                />
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Atal'dazar"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "AD", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Waycrest Manor"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "WM", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Throne of the Tides"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "TOTT", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Black Rook Hold"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "BRH", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Everbloom"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "EB", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"Darkheart Thicket"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "DHT", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
                <Row>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"DOTI: Murozond's Rise"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "RISE", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                    <Col span={12} xs={24} xl={12}>
                        <DungeonLadder
                            caption={"DOTI: Galakrond's Fall"}
                            loading={raiderioProfiles.length === 0}
                            gamersDungeon={raiderioProfiles.map(rio => gamerDungeonFromRaiderioProfile(rio, "FALL", raiderioCachedProfiles.find(c => c.id === rio.id))).sort((a, b) => b.score - a.score)}
                        />
                    </Col>
                </Row>
            </div>
        </ConfigProvider>
    );
}

export default App;

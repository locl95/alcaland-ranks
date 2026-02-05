import React, { useEffect, useState } from 'react';
import './App.css';
import { Ladder } from "./features/ladder/Ladder";
import { easyFetch } from "./utils/utils";
import { gamerFromRaiderioProfile } from "./features/ladder/types";
import { RaiderioProfile, Season, ViewData, Dungeon } from "./utils/raiderio";
import { DungeonLadder } from "./features/dungeon/DungeonLadder";
import { gamerDungeonFromRaiderioProfile } from "./features/dungeon/types";
import { Col, ConfigProvider, Row, theme } from "antd";
import { RankLadder } from "./features/rank/RankLadder";
import { gamerRankFromRaiderioProfile } from "./features/rank/types";
import { gamerRankSpecsFromRaiderioProfile } from "./features/rankSpecs/types";
import { RankSpecsLadder } from "./features/rankSpecs/RankSpecsLadder";
import { useParams } from "react-router-dom";

function App() {

    const [raiderioProfiles, setRaiderioProfiles] = useState<RaiderioProfile[]>([])
    const [raiderioCachedProfiles, setRaiderioCachedProfiles] = useState<RaiderioProfile[]>([])
    const [season, setSeason] = useState<Season | undefined>(undefined)
    const { viewId } = useParams()

    useEffect(() => {

        async function getData() {
            const [season, data, cachedData] = await Promise.all([
                easyFetch<Season>("GET", `/sources/wow/static`, undefined, `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`),
                easyFetch<ViewData>("GET", `/views/${viewId}/data`, undefined, `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`),
                easyFetch<ViewData>("GET", `/views/${viewId}/cached-data`, undefined, `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`)
            ]);
            setSeason(season)
            setRaiderioProfiles(data.data)
            setRaiderioCachedProfiles(cachedData.data)
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
                    gamers={raiderioProfiles.map(rio => gamerFromRaiderioProfile(rio, raiderioCachedProfiles.find(c => c.id === rio.id))).filter(g => g.score > 0).sort((a, b) => b.score - a.score)}
                />
                <RankLadder
                    caption={"General Rank"}
                    loading={raiderioProfiles.length === 0}
                    gamerRank={raiderioProfiles.map(rio => gamerRankFromRaiderioProfile(rio, raiderioCachedProfiles.find(c => c.id === rio.id))).filter(gr => gr.world > 0).sort((a, b) => a.world - b.world)}
                />
                <RankSpecsLadder
                    caption={"Specs Rank"}
                    loading={raiderioProfiles.length === 0}
                    gamerRank={raiderioProfiles.flatMap(rio => {
                        return rio.mythicPlusRanks.specs.map(mythicPlusRank => gamerRankSpecsFromRaiderioProfile(rio, mythicPlusRank, raiderioCachedProfiles.find(c => c.id === rio.id)?.mythicPlusRanks.specs.find(s => s.name === mythicPlusRank.name)))
                    }).filter(gr => gr.world > 0).sort((a, b) => b.score - a.score)}
                />
                {season && (
                    <>
                        {season.dungeons
                            .reduce<Dungeon[][]>((rows, dungeon, index) => {
                                if (index % 2 === 0) rows.push([dungeon])
                                else rows[rows.length - 1].push(dungeon)
                                return rows
                            }, [])
                            .map((pair, rowIndex) => (
                                <Row key={rowIndex}>
                                    {pair.map(dungeon => (
                                        <Col key={dungeon.short_name} span={12} xs={24} xl={12}>
                                            <DungeonLadder
                                                caption={dungeon.name}
                                                loading={raiderioProfiles.length === 0}
                                                gamersDungeon={raiderioProfiles
                                                    .map(rio =>
                                                        gamerDungeonFromRaiderioProfile(
                                                            rio,
                                                            dungeon.short_name,
                                                            raiderioCachedProfiles.find(c => c.id === rio.id)
                                                        )
                                                    )
                                                    .filter(gd => gd.score > 0)
                                                    .sort((a, b) => b.score - a.score)}
                                            />
                                        </Col>
                                    ))}
                                </Row>
                            ))}
                    </>
                )}

            </div>
        </ConfigProvider>
    );
}

export default App;

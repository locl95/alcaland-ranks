import React, { useEffect, useState } from "react"
import { ConfigProvider, Row, Col, Card, theme } from "antd"
import { easyFetch } from "./utils/utils"

import { GetViewsResponse  } from "./utils/views/GetViewsResponse"
import { SimpleView } from "./utils/views/SimpleView"

function App() {

    const [views, setViews] = useState<SimpleView[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadFeaturedViews() {
            try {
                const response = await easyFetch<GetViewsResponse>(
                    "GET",
                    "/views?game=wow&featured=true",
                    undefined,
                    `Bearer ${process.env.REACT_APP_SERVICE_TOKEN}`
                )

                setViews(response.views)
            } finally {
                setLoading(false)
            }
        }

        loadFeaturedViews()
    }, [])

    return (
        <ConfigProvider theme={{ algorithm: theme.darkAlgorithm }}>
            <div className="App">
                <Row gutter={[16, 16]}>
                    {views.map(view => (
                        <Col xs={24} md={12} xl={8} key={view.id}>
                            <Card
                                title={view.name}
                                loading={loading}
                                hoverable
                            >
                                <p>Owner: {view.owner}</p>
                                <p>Game: {view.game}</p>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>
        </ConfigProvider>
    )
}

export default App

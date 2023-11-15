import React from "react"
import {Table} from "antd"
import {Gamer} from "./types"
import {ColumnsType} from "antd/es/table"

interface LadderProps {
    gamers: Gamer[]
    caption: string
    loading: boolean
}

export const Ladder = (props: LadderProps) => {
    const columns: ColumnsType<Gamer> = [
        {title: "Name", dataIndex: "name"},
        {title: "Class", dataIndex: "class", responsive: ["sm"]},
        {title: "Spec", dataIndex: "spec"},
        {
            title: "Score", dataIndex: "score", render: (text, record) => (
                <span>{record.score} ({record.score - (record?.cachedScore ?? record.score)})</span>
            )
        },
        {
            title: "Quantile", dataIndex: "quantile", render: (text, record) => (
                <span>{record.quantile} ({record.quantile - (record?.quantile ?? record.cachedQuantile)})</span>
            )
        }
    ]

    return (
        <div>
            <Table
                columns={columns}
                dataSource={props.gamers}
                pagination={false}
                showHeader={true}
                bordered={true}
                caption={<div className={"font-face-lc"}><h1>{props.caption}</h1></div>}
                loading={props.loading}
            />
        </div>
    )
}

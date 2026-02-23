import React from "react"
import {Table} from "antd"
import {Gamer} from "./types"
import {ColumnsType} from "antd/es/table"
import Comparable from "../comparables/Comparable";

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
            title: "Score",
            dataIndex: "score",
            render: (text, record) => <Comparable greenWhenUp={true} number={record.score}
                                                  difference={record.scoreDifference}/>
        },
        {
            title: "Quantile",
            dataIndex: "quantile",
            render: (text, record) => <Comparable greenWhenUp={false} number={record.quantile}
                                                  difference={record.quantileDifference}/>
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

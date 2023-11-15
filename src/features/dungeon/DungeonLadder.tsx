import React from "react"
import {Table} from "antd"
import {GamerDungeon} from "./types"
import {ColumnsType} from "antd/es/table"
import Comparable from "../comparables/Comparable";

interface DungeonLadderProps {
    gamersDungeon: GamerDungeon[]
    loading: boolean
    caption: string
}

export const DungeonLadder = (props: DungeonLadderProps) => {
    const columns: ColumnsType<GamerDungeon> = [
        {title: "Name", dataIndex: "name"},
        {
            title: "Tyrannical Level",
            dataIndex: "tyrannicalLevel",
            sorter: (a, b) => a.tyrannicalLevel.localeCompare(b.tyrannicalLevel),
            render: (text, record) => (
                <a target="_blank" rel="noreferrer" href={record.tyrannicalUrl}>{text}</a>
            ),
        },
        {
            title: "Fortified Level",
            dataIndex: "fortifiedLevel",
            sorter: (a, b) => a.fortifiedLevel.localeCompare(b.fortifiedLevel),
            render: (text, record) => (
                <a target="_blank" rel="noreferrer" href={record.fortifiedUrl}>{text}</a>
            ),
        },
        {
            title: "Score",
            dataIndex: "score",
            sorter: (a, b) => a.score - b.score,
            render: (text, record) => <Comparable greenWhenUp={true} number={record.score}
                                                  difference={record.scoreDifference}/>
        }
    ]

    return (
        <div>
            <Table
                columns={columns}
                dataSource={props.gamersDungeon}
                pagination={false}
                showHeader={true}
                bordered={true}
                caption={<div className={"font-face-lc"}><h1>{props.caption}</h1></div>}
                loading={props.loading}
            />
        </div>
    )
}

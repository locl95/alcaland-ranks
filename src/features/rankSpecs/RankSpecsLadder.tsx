import React from "react"
import { Table } from "antd"
import {GamerRankSpec } from "./types"
import { ColumnsType } from "antd/es/table"

interface RankLadderProps {
  gamerRank: GamerRankSpec[]
  caption: string
}
export const RankSpecsLadder = (props: RankLadderProps) => {
  const columns: ColumnsType<GamerRankSpec> = [
    { title: "Name", dataIndex: "name" },
    { title: "Spec", dataIndex: "spec" },
    { title: "World", dataIndex: "world", sorter: (a,b) => a.world-b.world},
    { title: "Region", dataIndex: "region", sorter: (a,b) => a.region-b.region },
    { title: "Realm", dataIndex: "realm", sorter: (a,b) => a.realm-b.realm }
  ]

  return (
    <div>
      <Table columns={columns} dataSource={props.gamerRank} pagination={false} showHeader={true} bordered={true} caption={props.caption}/>
    </div>
  )
}

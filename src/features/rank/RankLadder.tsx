import React from "react"
import { Table } from "antd"
import {GamerRank } from "./types"
import { ColumnsType } from "antd/es/table"

interface RankLadderProps {
  gamerRank: GamerRank[]
  caption: string
  loading: boolean
}
export const RankLadder = (props: RankLadderProps) => {
  const columns: ColumnsType<GamerRank> = [
    { title: "Name", dataIndex: "name" },
    { title: "World", dataIndex: "world", sorter: (a,b) => a.world-b.world},
    { title: "Region", dataIndex: "region", sorter: (a,b) => a.region-b.region },
    { title: "Realm", dataIndex: "realm", sorter: (a,b) => a.realm-b.realm }
  ]

  return (
    <div>
      <Table
          columns={columns}
          dataSource={props.gamerRank}
          pagination={false}
          showHeader={true}
          bordered={true}
          caption={<div className={"font-face-lc"}><h1>{props.caption}</h1></div>}
          loading={props.loading}
      />
    </div>
  )
}

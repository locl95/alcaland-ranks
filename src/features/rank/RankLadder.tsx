import React from "react"
import { Table } from "antd"
import {GamerRank } from "./types"
import { ColumnsType } from "antd/es/table"

interface RankLadderProps {
  gamerRank: GamerRank[]
}
export const RankLadder = (props: RankLadderProps) => {
  const columns: ColumnsType<GamerRank> = [
    { title: "Name", dataIndex: "name" },
    { title: "World", dataIndex: "world" },
    { title: "Region", dataIndex: "region" },
    { title: "Realm", dataIndex: "realm" }
  ]

  return (
    <div>
      <Table columns={columns} dataSource={props.gamerRank} pagination={false} showHeader={true}/>
    </div>
  )
}

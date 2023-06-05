import React from "react"
import { Table } from "antd"
import {GamerRankSpec } from "./types"
import { ColumnsType } from "antd/es/table"

interface RankLadderProps {
  gamerRank: GamerRankSpec[]
}
export const RankSpecsLadder = (props: RankLadderProps) => {
  const columns: ColumnsType<GamerRankSpec> = [
    { title: "Name", dataIndex: "name" },
    { title: "Spec", dataIndex: "spec" },
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

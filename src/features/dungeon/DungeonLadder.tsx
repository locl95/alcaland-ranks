import React from "react"
import { Table } from "antd"
import { GamerDungeon } from "./types"
import { ColumnsType } from "antd/es/table"

interface DungeonLadderProps {
  gamersDungeon: GamerDungeon[]
  caption: string
}
export const DungeonLadder = (props: DungeonLadderProps) => {
  const columns: ColumnsType<GamerDungeon> = [
    { title: "Name", dataIndex: "name" },
    { title: "Level", dataIndex: "level" },
    { title: "Score", dataIndex: "score"}
  ]

  return (
    <div>
      <Table columns={columns} dataSource={props.gamersDungeon} pagination={false} showHeader={false} bordered={true} caption={props.caption}/>
    </div>
  )
}

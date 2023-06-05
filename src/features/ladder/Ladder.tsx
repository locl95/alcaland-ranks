import React from "react"
import { Table } from "antd"
import { Gamer } from "./types"
import { ColumnsType } from "antd/es/table"

interface LadderProps {
  gamers: Gamer[]
  caption: string
}
export const Ladder = (props: LadderProps) => {
  const columns: ColumnsType<Gamer> = [
    { title: "Name", dataIndex: "name" },
    { title: "Class", dataIndex: "class" },
    { title: "Spec", dataIndex: "spec" },
    { title: "Score", dataIndex: "score"}
  ]

  return (
    <div>
      <Table columns={columns} dataSource={props.gamers} pagination={false} showHeader={false} bordered={true} caption={props.caption}/>
    </div>
  )
}

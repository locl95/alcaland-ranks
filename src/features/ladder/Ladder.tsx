import React from "react"
import { Table } from "antd"
import { Gamer } from "./types"
import { ColumnsType } from "antd/es/table"

interface LadderProps {
  gamers: Gamer[]
  caption: string
  loading: boolean
}
export const Ladder = (props: LadderProps) => {
  const columns: ColumnsType<Gamer> = [
    { title: "Name", dataIndex: "name" },
    { title: "Class", dataIndex: "class" },
    { title: "Spec", dataIndex: "spec" },
    { title: "Score", dataIndex: "score"},
    { title: "Quantile", dataIndex: "quantile"}
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

import {wentDown, wentUp} from "../../utils/utils";
import React from "react";

interface ComparableProps {
    number: number
    difference?: number
    greenWhenUp: boolean
}

export const Comparable = (props: ComparableProps) => {
    if (props.greenWhenUp) return <span>{props.number} {(wentUp(props.difference) &&
        <span style={{color: "green"}}> (+{props.difference})</span>) || (wentDown(props.difference) &&
        <span style={{color: "red"}}> ({props.difference})</span>)}</span>
    else return <span> {props.number}{(wentUp(props.difference) &&
        <span style={{color: "red"}}> (+{props.difference})</span>) || (wentDown(props.difference) &&
        <span style={{color: "green"}}> ({props.difference})</span>)}</span>
}

export default Comparable
import React, { Fragment } from 'react'
import {useAppSelector} from "../app/hooks";
import {selectLoading} from "../features/loading/loadingSlice";

export const Loading: React.FC = () => {
  const isLoading = useAppSelector(selectLoading)
  return (
    <Fragment>
      {isLoading ? (
        <Fragment>
          <div className="a_loading">
            <div className="loading-spinner" />
          </div>
        </Fragment>
      ) : (
        <span />
      )}
    </Fragment>
  )
}
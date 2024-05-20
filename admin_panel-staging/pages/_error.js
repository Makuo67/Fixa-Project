import React from 'react'
import Error from "../components/Error/Error"

export default function error() {
  return (
    <div>
        <Error status={400} backHome={false} />
    </div>
  )
}

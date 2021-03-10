import ReactDOM from 'react-dom'
import React, { useEffect } from 'react'
import { System } from './System'

function App() {
    useEffect(() => {
        const system = System
            .setAvailableResources([2, 3, 3])
            .setProcesses([
                { name: 'P1', allocations: [2, 1, 2], needs: [3, 4, 7], isFinish: false },
                { name: 'P2', allocations: [4, 0, 2], needs: [1, 3, 4], isFinish: false },
                { name: 'P3', allocations: [4, 0, 5], needs: [0, 0, 6], isFinish: false },
                { name: 'P4', allocations: [2, 0, 4], needs: [2, 2, 1], isFinish: false },
                { name: 'P5', allocations: [3, 1, 4], needs: [1, 1, 0], isFinish: false },
            ])
        const canAssignResources = system.assignResources('P2', [0, 3, 4])
    }, [])

    return (
        <div>Hello World!</div>
    )
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
)